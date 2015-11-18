var request = require("request");


var Bot = function(TOKEN) {
    this.TOKEN = TOKEN;
    this.URL = "https://api.telegram.org/bot" + TOKEN + "/";
}

Bot.prototype.sendMessage = function(message, id) {
    request.post(this.URL + "sendMessage?chat_id=" + id + "&text=" + message, function(error, response, body){
        if (response.statusCode == 200) {
            console.log("Success!");
        } else {
            console.log('Error: '+ response.statusCode);
            console.log(body);
        }
    });
};

module.exports = Bot;