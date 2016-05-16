"use strict";

const request = require("axios");
const EventEmitter = require("events").EventEmitter;


class Bot {
  constructor(token) {
    this.token = token;
    this.url = `https://api.telegram.org/bot${token}/`;
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
      console.log("Botogram Error. There is no this message handler:", type);
    }
  }
  
  sendMessage(text, id, params) {
    return new Promise((resolve, reject) => {
      params = params || {};
      
      request.post(this.url + "sendMessage?chat_id=" + id + "&text=" +
        (params.encode === false ? text : encodeURI(text)) +
        (params.parse_mode ? "&parse_mode=" + params.parse_mode : "") +
        (params.disable_web_page_preview ? "&disable_web_page_preview=true" : "") +
        (params.reply_to_message_id ? "&reply_to_message_id=" + params.reply_to_message_id : "") +
        (params.reply_markup ? "&reply_markup=" + JSON.stringify(params.reply_markup) : ""))
          .then(res => {
            resolve(res.data);
          })
          .catch(err => {
            reject(err.data);
          });
        
    });
  }
  
  on(event, callback) {
    this._emitter.on(event, callback);    
  }
  
  _messageHandler(body) {
    let length = Object.keys(body.message).length;
    let type = Object.keys(body.message)[length - 1];
    
    if (this._emitter.emit(type, body.message)) {
      this._logMessage(body.message);
    } else {
      console.log(`${this.data.first_name}'s on${type} listener is not defined.`);
    }
  }
  
  _callbackQueryHandler(body) {
    if (this._emitter.emit("callback_query", body.callback_query)) {
      this._logMessage(body.callback_query);
    } else {
      console.log(`${this.data.first_name}'s callback_query listener is not defined.`);
    }
  }
  
  _getMe() {
    request(this.url + "getMe")
      .then(res => {
        this.data = res.data.result;
      })
      .catch(err => {
        throw new Error(err);
      });
  }
  
  _logMessage(message) {
    let length = Object.keys(message).length;
    let type = Object.keys(message)[length - 1];
    
    console.log(`(${new Date().toUTCString()}) => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): ${message[type]}`);
  }
}

module.exports = Bot;