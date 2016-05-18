"use strict";

const request = require("axios");
const EventEmitter = require("events").EventEmitter;


class Bot {
  constructor(token) {
    this.token = token;
    this.url = `https://api.telegram.org/bot${token}/`;
    this.commands = {};
    this.data = {};
    this._emitter = new EventEmitter();
    
    this._types = {
      message: body => this._messageHandler(body),
      callback_query: body => this._callbackQueryHandler(body)
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
    
    this.getMe()
      .then(data => {
        this.data = data;
      })
      .catch(err => {
        throw new Error(err);
      });
      
    (this.listen = (req, res, next) => {
      res.end();
      if (!req.body) throw new Error("Botogram's 'listen' method requires bodyParser.");
  
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
      console.log("Botogram Error. There is no this message handler:", type);
    }
  }
  
  getMe() {
    return new Promise((resolve, reject) => {
      request(this.url + "getMe")
        .then(res => {
          resolve(res.data.result);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendMessage(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendMessage", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  forwardMessage(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "forwardMessage", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendPhoto(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendPhoto", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendAudio(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendAudio", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendDocument(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendDocument", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendSticker(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendSticker", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendVideo(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendVideo", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendVoice(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendVoice", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendLocation(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendLocation", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendVenue(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendVenue", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendContact(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendContact", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  sendChatAction(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "sendChatAction", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  getUserProfilePhotos(params) {
    return new Promise((resolve, reject) => {
      request(this.url + "getUserProfilePhotos", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  getFile(params) {
    return new Promise((resolve, reject) => {
      request(this.url + "getFile", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  kickChatMember(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "kickChatMember", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  unbanChatMember(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "unbanChatMember", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  answerCallbackQuery(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "answerCallbackQuery", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  editMessageText(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "editMessageText", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  editMessageCaption(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "editMessageCaption", params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err.data);
        });
    });
  }
  
  editMessageReplyMarkup(params) {
    return new Promise((resolve, reject) => {
      request.post(this.url + "editMessageCaption", params)
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
    let type = this._messageTypes.filter(type => {
      return body.message[type];
    })[0];
    
    if (this._emitter.emit(type, body.message)) {
      this._logMessage(body.message);
    } else {
      console.log(`${this.data.username}'s on${type} listener is not defined.`);
    }
  }
  
  _callbackQueryHandler(body) {
    if (this._emitter.emit("callback_query", body.callback_query)) {
      this._logMessage(body.callback_query);
    } else {
      console.log(`${this.data.username}'s callback_query listener is not defined.`);
    }
  }
  
  _logMessage(message) {
    let length = Object.keys(message).length;
    let type = Object.keys(message)[length - 1];
    
    console.log(`(${new Date().toUTCString()}) => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): ${message[type]}`);
  }
}

module.exports = Bot;