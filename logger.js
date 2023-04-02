var url = 'http://tiloger.pl/log';

function log(wiadomosc) {    // domyślnie, pola i funkcje są prywatne
    //Wysyłamy żądanie do HTTP
    console.log(wiadomosc);
}

module.exports.log = log;
module.exports.endPoint = url;

const EventEmmiter = require('events');

class Logger extends EventEmmiter {
    log(wiadomosc, id, dane) {
        //Wysyłamy żądanie do HTTP
        console.log(wiadomosc);
        this.emit('messageLoggedLogger', {id: id, dane: dane});
    }
}

module.exports = Logger;
