var request = require("request");


var Bot = function(TOKEN) {
    this.TOKEN = TOKEN;
    this.URL = "https://api.telegram.org/bot" + TOKEN;
}

Bot.prototype.sendMessage = function(message, id) {
    if (id < 0) request.post(this.URL + "sendMessage?chat_id=%s&text=%s", id, message);
    else request.post(this.URL + "sendMessage?user_id=%s&text=%s", id, message);
};

module.exports = Bot;