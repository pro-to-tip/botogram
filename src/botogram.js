import request from "axios";
import {EventEmitter} from "events";


export default class Bot {
  constructor(token) {
    this.token = token;
    this.url = `https://api.telegram.org/bot${token}/`;
    this.data = {};
    this._emitter = new EventEmitter();
    
    this._types = {
      message: this._messageHandler.bind(this),
      callback_query: this._callbackQueryHandler.bind(this)
    };
    
    this._messageTypes = [
      "text", 
      "photo", 
      "document", 
      "audio", 
      "sticker", 
      "video", 
      "voice", 
      "contact", 
      "location", 
      "venue"
    ];
    
    this._messageEntities = {
      bot_command: this._botCommandEntityHandler.bind(this)
    };
    
    this.getMe()
      .then(data => {
        this.data = data.result;
      })
      .catch(err => {
        throw new Error(err);
      });
      
    (this.listen = (req, res, next) => {
      res.end();
      if (!req.body) throw new Error("Botogram's 'listen' method requires body-parser. Use npm install --save body-parser.");
  
      next();
      this._bodyHandler(req.body);
    }).bind(this);  
  }
  
  take(body) {
    this._bodyHandler(body);
  }
  
  _bodyHandler(body) {
    let type = Object.keys(body)[1];
    
    if (this._types[type]) {
      this._types[type](body);
    } else {
      console.error("Botogram Error. There is no this message handler:", type);
    }
  }
  
  _request(method, params) {
    return new Promise(resolve => {
      request(this.url + method, params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  getMe() {
    return this._request("getMe");
  }
  
  sendMessage(params) {
    return this._request("sendMessage", params);
  }
  
  forwardMessage(params) {
    return this._request("forwardMessage", params);
  }
  
  sendPhoto(params) {
    return this._request("sendPhoto", params);
  }
  
  sendAudio(params) {
    return this._request("sendAudio", params);
  }
  
  sendDocument(params) {
    return this._request("sendDocument", params);
  }
  
  sendSticker(params) {
    return this._request("sendSticker", params);
  }
  
  sendVideo(params) {
    return this._request("sendVideo", params);
  }
  
  sendVoice(params) {
    return this._request("sendVoice", params);
  }
  
  sendLocation(params) {
    return this._request("sendLocation", params);
  }
  
  sendVenue(params) {
    return this._request("sendVenue", params);
  }
  
  sendContact(params) {
    return this._request("sendContact", params);
  }
  
  sendChatAction(params) {
    return this._request("sendChatAction", params);
  }
  
  getUserProfilePhotos(params) {
    return this._request("getUserProfilePhotos", params);
  }
  
  getFile(params) {
    return this._request("getFile", params);
  }
  
  kickChatMember(params) {
    return this._request("kickChatMember", params);
  }
  
  unbanChatMember(params) {
    return this._request("unbanChatMember", params);
  }
  
  answerCallbackQuery(params) {
    return this._request("answerCallbackQuery", params);
  }
  
  editMessageText(params) {
    return this._request("editMessageText", params);
  }
  
  editMessageCaption(params) {
    return this._request("editMessageCaption", params);
  }
  
  editMessageReplyMarkup(params) {
    return this._request("editMessageReplyMarkup", params);
  }
  
  on(event, callback) {
    this._emitter.on(event, callback);    
  }
  
  _emit(type, data) {
    if (this._emitter.emit(type, data)) {
      this._logMessage(data);
      return true;
    } else {
      console.log(`${this.data.username}'s on "${type}" listener is not defined.`);
      return false;
    }
  }
  
  _messageHandler(body) {
    let message = body.message,
      type = this._messageTypes.filter(type => {
        return message[type];
      })[0];
    
    if (message.entities) {
      for (let entity of message.entities) {
        if (this._messageEntities[entity.type]) {
          this._messageEntities[entity.type]({
            message,
            offset: entity.offset,
            length: entity.length
          });
           
          return;
        }
      }
    }
    
    this._emit(type, body.message) || this._emit("message", body.message) || this._emit("*", body.message);
  }
  
  _callbackQueryHandler(body) {
    this._emit("callback_query", body.callback_query) || this._emit("*", body.message);
  }
  
  _botCommandEntityHandler(entity) {
    let command = entity.message.text.substr(entity.offset, entity.length).slice(1);
    
    if (this._types[command] || this._messageTypes.indexOf(command) !== -1) {  // defence of reserved events from any user's invocations
      this._emit("command", entity.message) || this._emit("*", entity.message);
    } else {
      this._emit(command, entity.message) || this._emit("command", entity.message) || this._emit("*", entity.message);
    }
  }
  
  _logMessage(message) {
    let type = this._messageTypes.filter(type => {
      return message[type];
    })[0];
    
    console.log(`(${new Date().toUTCString()}) => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): ${message[type]}`);
  }
}