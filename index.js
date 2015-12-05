var request = require("request");

var Bot = function(TOKEN) {
    this.TOKEN = TOKEN;
    this.URL = "https://api.telegram.org/bot" + TOKEN + "/";
    
    this.getMe(function(body, that){
        that.ID = body.result.id;
        that.NAME = body.result.first_name;
        that.USERNAME = body.result.username;
    });
    
    this.listeners = {};
}

Bot.prototype.getMe = function(callback) {
    var that = this;
    
    request.get(this.URL + "getMe", function(error, response, body){
        if (response.statusCode == 200) {
            callback(JSON.parse(body), that);
        } else {
            throw new Error(response.statusCode);
            console.log(body);
        }
    });
};

Bot.prototype.sendMessage = function(message, id) {
    request.post(encodeURI(this.URL + "sendMessage?chat_id=" + id + "&text=" + message), function(error, response, body){
        if (response.statusCode != 200) {
            throw new Error(response.statusCode);
            console.log(body);
        }
    });
};

Bot.prototype.listen = function(body) {
    var message = body.message;
    
    if (message.text) {
        this.listeners["text"] ? this.listeners["text"](body.message) || 
        console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): %s", 
        this.NAME, message.from.username, message.from.first_name, message.from.last_name, message.from.id, message.text): 
        
        console.log(this.NAME + ": Bot's ontext listener is not defined.");
    } else {
        if (message.sticker) {
            this.listeners["sticker"] ? this.listeners["sticker"](message) ||
            console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): (sticker)", 
            this.NAME, message.from.username, message.from.first_name, message.from.last_name, message.from.id):
            
            console.log(this.NAME + ": Bot's onsticker listener is not defined.");
        } else if (message.photo) {
            this.listeners["photo"] ? this.listeners["photo"](message) ||
            console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): (photo)", 
            this.NAME, message.from.username, message.from.first_name, message.from.last_name, message.from.id):
            
            console.log(this.NAME + ": Bot's onphoto listener is not defined.");
        } else if (message.document) {
            this.listeners["document"] ? this.listeners["document"](message) ||
            console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): (document)", 
            this.NAME, message.from.username, message.from.first_name, message.from.last_name, message.from.id): 
            
            console.log(this.NAME + ": Bot's ondocument listener is not defined.");
        } else if (message.voice) {
            this.listeners["voice"] ? this.listeners["voice"](message) ||
            console.log("(" + new Date().toUTCString() + ") => %s: [%s] %s %s (%s): (voice)", 
            this.NAME, message.from.username, message.from.first_name, message.from.last_name, message.from.id): 
            
            console.log(this.NAME + ": Bot's onvoice listener is not defined.");
        }
    }
};



Bot.prototype.on = function(listener, callback) {
    if (Array.isArray(listener)) {
        var that = this;
        
        listener.forEach(function(listener) {
            that.listeners[listener] = callback;
        });
    } else {
        switch (listener) {
            case "text": this.listeners["text"] = callback; break;
            case "sticker": this.listeners["sticker"] = callback; break;
            case "photo": this.listeners["photo"] = callback; break;
            case "document": this.listeners["document"] = callback; break;
            case "voice": this.listeners["voice"] = callback;
        }
    }
};

module.exports = Bot;