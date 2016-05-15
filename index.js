"use strict";

const request = require("request");
const EventEmitter = require("events").EventEmitter;


class Bot {
  constructor(token) {
    this.token = token;
    this.url = "https://api.telegram.org/bot" + token + "/";
    this.data = {};
    this._emitter = new EventEmitter();
    
    this._types = {
      message: body => this._messageHandler(body),
      callback_query: body => this._callbackQueryHandler(body)
    };
    
    this._getMe();
  }
  
  listen(body) {
    let type = Object.keys(body)[1];
    
    if (this._types[type]) {
      this._types[type](body);
    } else {
      console.log("Bot Api Error. There is no that message handler:", type);
    }
  }
  
  sendMessage(text, id, params) {
    return new Promise((resolve, reject) => {
      params = params || {};
      params.encode === undefined && params.encode !== false ? params.encode = true : params.encode = false;
      
      request.post(this.URL + "sendMessage?chat_id=" + id + "&text=" +
        (params.encode ? encodeURI(text) : text) +
        (params.parse_mode ? "&parse_mode=" + params.parse_mode : "") +
        (params.disable_web_page_preview === true? "&disable_web_page_preview=true" : "") +
        (params.reply_to_message_id ? "&reply_to_message_id=" + params.reply_to_message_id : "") +
        (params.reply_markup ? "&reply_markup=" + JSON.stringify(params.reply_markup) : ""), (err, res, body) => {
          if (err) return reject(err);
          if (res.statusCode > 400) return reject(res);
          
          resolve(JSON.parse(body));
      });
    });
  }
  
  on(event, callback) {
    this._emitter.on(event, callback);    
  }
  
  _messageHandler(body) {
    let type = Object.keys(body.message)[4];
    
    if (this._emitter.emit(type, body.message)) {
      this._logMessage(body.message);
    } else {
      console.log(`Bot's on${type} listener is not defined.`);
    }
  }
  
  _callbackQueryHandler(body) {
    if (this._emitter.emit("callback_query", body.callback_query)) {
      this._logMessage(body.callback_query);
    } else {
      console.log("Bot's callback_query listener is not defined.");
    }
  }
  
  _getMe() {
    request(this.url + "getMe", (err, res, body) => {
      if (!err && res.statusCode === 200) {
        this.data = JSON.parse(body).result;
      } else {
        throw new Error(err);
      }
    });
  }
  
  _logMessage(message) {
    let type = Object.keys(message)[4];
    
    console.log(`(${new Date().toUTCString()}) => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): ${message[type]}`);
  }
}

module.exports = Bot;
