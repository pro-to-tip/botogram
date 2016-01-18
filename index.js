"use strict";

const request = require("request");
const EventEmitter = require("events").EventEmitter;


class Bot {
    constructor(TOKEN) {
        this.TOKEN = TOKEN;
        this.URL = "https://api.telegram.org/bot" + TOKEN + "/";
        this.DATA = {};
        this.emitter = new EventEmitter();
        
        this._getMe();
    }
    
    sendMessage(message, id) {
        request.post(encodeURI(this.URL + "sendMessage?chat_id=" + id + "&text=" + message), (err, res, body) => {
            if (!err && res.statusCode != 200) {
                throw new Error(res.statusCode);
            }
        });
    }
    
    on(event, callback) {
        this.emitter.on(event, callback);    
    }
    
    listen(body) {
        var message = body.message;
        
        if (message.text) {
            if (this.emitter.emit("text", message)) {
                this._logMessage(message);
            } else {
                console.log("Bot's ontext listener is not defined.")
            }
        } else if (message.sticker) {
            if (this.emitter.emit("sticker", message)) {
                this._logMessage(message);
            } else {
                console.log("Bot's onsticker listener is not defined.")
            }
        } else if (message.photo) {
            if (this.emitter.emit("photo", message)) {
                this._logMessage(message);
            } else {
                console.log("Bot's onphoto listener is not defined.")
            }
        } else if (message.document) {
            if (this.emitter.emit("document", message)) {
                this._logMessage(message);
            } else {
                console.log("Bot's ondocument listener is not defined.")
            }
        } else if (message.voice) {
            if (this.emitter.emit("voice", message)) {
                this._logMessage(message);
            } else {
                console.log("Bot's onvoice listener is not defined.")
            }
        }
    }
    
    _getMe() {
        request(this.URL + "getMe", (err, res, body) => {
            if (!err && res.statusCode === 200) {
                this.DATA = JSON.parse(body).result;
            } else {
                throw new Error(err);
            }
        });
    }
    
    _logMessage(message) {
        console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): %s", 
            this.DATA.first_name, message.from.username, message.from.first_name, message.from.last_name, message.from.id, message.text);
    }
}

module.exports = Bot;