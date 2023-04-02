const express = require('express');
const app = express();
const Joi = require('joi');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, './static')));
app.use(cookieParser('tajnykluczti'));
app.use(express.urlencoded( {extended: true} ));
app.use(express.json());
app.use(session( {
    resave: true,
    saveUninitialized: true,
    secret: 'tajnykluczsesjiti'
}));

const lista = [
    { id: 1, nazwa: 'ALFA ROMEO'} ,
    { id: 2, nazwa: 'AUDI'} ,
    { id: 3, nazwa: 'BMW' } ,
    { id: 4, nazwa: 'CITROEN' },
    { id: 5, nazwa: 'FIAT' },
    { id: 6, nazwa: 'FORD' },
    { id: 7, nazwa: 'HONDA' },
    { id: 8, nazwa: 'JAGUAR' },
    { id: 9, nazwa: 'MAZDA' },
];

const uzytkownicy = [
    { id: 1, username: "user", password: "user", permissions: 0},   //nieaktywny
    { id: 1, username: "xyz", password: "xyz", permissions: 0}, //nieaktywny
    { id: 3, username: "qwe", password: "qwe", permissions: 1}, //aktywny
    { id: 2, username: "ewq", password: "ewq", permissions: 1}, //aktywny
    { id: 4, username: "admin", password: "admin", permissions: 2}, //administrator
];

app.get('/', (req, res) => {
    let uzytkownikCiastko = req.signedCookies.uzytkownik;
    res.render('index', {username: 'testowy', lista: lista, uzytkownik: uzytkownikCiastko});
});

app.get('/api/users', (req, res) => {
    res.send(uzytkownicy);
});

app.get('/wyloguj', authorize, (req, res) => {
    res.cookie('uzytkownik', '', { maxAge: -1});
    res.redirect('/');
});

app.get('/zaloguj', (req, res) => {
    res.render('zaloguj');
});

app.get('/api/lista', (req, res) => {
    res.send(lista);
});

app.get('/api/lista/:id(\\d+)', (req, res) => {
    let element = lista.find(l => l.id === parseInt(req.params.id));
    if (!element)
        res.status(404).send('Element o takim id nie został znaleziony');
    else
        res.send(element);
});

app.post('/zaloguj', (req, res) => {
    let username = req.body.txtUser;
    let password = req.body.txtPwd;
    let osoba = uzytkownicy.find(u => (u.username === username && u.password === password));
    if (!osoba)
        res.render('zaloguj', {message: 'Niepoprawna nazwa użytkownika lub hasło'});
    else {
        res.cookie('uzytkownik', osoba, {signed: true});
        let returnUrl = req.query.returnUrl;
        if (returnUrl)
            res.redirect(returnUrl);
        else res.redirect('/');
    }
});

app.post('/api/users', (req, res) => {
    const { error } = sprawdzUzytkownika(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    const osoba = {
        id: uzytkownicy.length + 1,
        username: req.body.username,
        password: req.body.password,
        permissions: 0
    };
    uzytkownicy.push(osoba);
    res.send(osoba);
});

app.post('/api/lista', (req, res) => {
    const { error } = sprawdzElement(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    const element = {
        id: lista.length + 1,
        nazwa: req.body.nazwa
    };
    lista.push(element);
    res.send(element);
});

//zmiana username lub password
// app.put('/api/users/rename', (req, res) => {
app.put('/api/users/:id', (req, res) => {
    // let osoba = uzytkownicy.find(u => u.id === parseInt(req.signedCookies.uzytkownik.id));
    let osoba = uzytkownicy.find(u => u.id === parseInt(req.params.id));
    if (!osoba)
        res.render('zaloguj', {message: 'Niepoprawna nazwa użytkownika lub hasło'});
    const wynik = sprawdzUzytkownika(req.body);
    if (wynik.error) {
        res.status(400).send(wynik.error.details[0].message);
        return;
    }
    osoba.username = req.body.username;
    osoba.password = req.body.password;
    res.send(osoba);
});

app.put('/api/lista/:id', (req, res) => {
    let element = lista.find(l => l.id === parseInt(req.params.id));
    if (!element)
        res.status(404).send('Element o takim id nie został znaleziony');
    const wynik = sprawdzElement(req.body);
    if (wynik.error) {
        res.status(400).send(wynik.error.details[0].message);
        return;
    }
    element.nazwa = req.body.nazwa;
    res.send(element);
});

app.delete('/api/users/:id', (req, res) => {
    let osoba = uzytkownicy.find(u => u.id === parseInt(req.params.id));
    if (!osoba)
        res.status(404).send('Uzytkownik o takim id nie został znaleziony');
    const index = uzytkownicy.indexOf(osoba);
    uzytkownicy.splice(index, 1);
    res.send(osoba);
});

app.delete('/api/lista/:id', (req, res) => {
    let element = lista.find(l => l.id === parseInt(req.params.id));
    if (!element)
        res.status(404).send('Element o takim id nie został znaleziony');
    const index = lista.indexOf(element);
    lista.splice(index, 1);
    res.send(element);
});

app.use('/ciastko', (req, res) => {
    let cookieValue;
    if (!req.cookies.ciasteczko) {
        cookieValue = new Date().toString();
        res.cookie('ciasteczko', cookieValue);
    } else {
        cookieValue = req.cookies.ciasteczko;
    }
    res.render("ciastko", { cookieValue: cookieValue });
});

app.use("/tajneciastko", (req, res) => {
    let cookieValue;
    if (!req.signedCookies.tajneciasteczko) {
        cookieValue = "TAJNA INFORMACJA";
        res.cookie('tajneciasteczko', cookieValue, {signed: true});
    } else {
        cookieValue = req.signedCookies.tajneciasteczko;
    }
    res.render("ciastko", {cookieValue: cookieValue});
});

app.use('/sesja', authorize, (req, res) => {
    let sessionValue;
    if (!req.session.wartosjSesji) {
        sessionValue = `data w sesji: ${new Date()}`;
        req.session.wartosjSesji = sessionValue;
    } else {
        sessionValue = req.session.wartosjSesji;
    }
    res.render("sesja", { sessionValue: sessionValue});
});

app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url});
});

function authorize(req, res, next) {
    if (req.signedCookies.uzytkownik) {
        req.uzytkownik = req.signedCookies.uzytkownik;
        next();
    } else {
        res.redirect('/zaloguj?returnUrl='+req.url);
    }
}

function sprawdzElement(element) {
    const schemat = {
        nazwa: Joi.string().min(3).required()
    }
    return Joi.validate(element, schemat);
}

function sprawdzUzytkownika(osoba) {
    const schemat = {
        username: Joi.string().min(3).required(),
        password: Joi.string().min(3).required()
    }
    return Joi.validate(osoba, schemat);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Oczekuje na porcie ${port}...`);
});