var request = require("request");


var Bot = function(TOKEN) {
    this.TOKEN = TOKEN;
    this.URL = "https://api.telegram.org/bot" + TOKEN + "/";
}

Bot.prototype.ontext = null;
Bot.prototype.onphoto = null;
Bot.prototype.onsticker = null;
Bot.prototype.document = null;
Bot.prototype.onvoice = null;

Bot.prototype.sendMessage = function(message, id) {
    request.post(encodeURI(this.URL + "sendMessage?chat_id=" + id + "&text=" + message), function(error, response, body){
        if (response.statusCode != 200) {
            console.log("Error: " + response.statusCode);
            console.log(body);
        }
    });
};

Bot.prototype.listen = function(body) {
    if (body.message.text) {
        this.ontext != null ? this.ontext(body.message) : console.log("Bot's ontext property is not defined.");
    } else if (body.message.photo) {
        this.onphoto != null ? this.onphoto(body.message) : console.log("Bot's onphoto property is not defined.");
    } else if (body.message.sticker) {
        this.onsticker != null ? this.onsticker(body.message) : console.log("Bot's onsticker property is not defined.");
    } else if (body.message.document) {
        this.ondocument != null ? this.ondocument(body.message) : console.log("Bot's ondocument property is not defined.");
    } else if (body.message.voice) {
        this.onvoice != null ? this.onvoice(body.message) : console.log("Bot's onvoice property is not defined.");
    } else {
        console.log("Error. Wrong request.");
    }

};

module.exports = Bot;