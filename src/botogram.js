import request from "request";
import {EventEmitter} from "events";
import fileType from "file-type";
import fs from "fs";
import path from "path";
import mime from "mime";
import url from "url";
import {isURL} from "validator";
import stream from "stream";


export default class Bot extends EventEmitter {
  constructor(token) {
    if (typeof token !== "string") throw new TypeError("You need to pass a bot token into the constructor.");
    
    super();
    this.token = token;
    this.url = `https://api.telegram.org/bot${token}/`;
    this.data = {};
    this._events = {
      message: this._messageHandler.bind(this),
      callback_query: this._callbackQueryHandler.bind(this)
    };

    this._messageTypes = [
      "text", "photo", "document", "audio", "sticker",
      "video", "voice", "contact", "location", "venue"
    ];

    this._messageEntities = {
      bot_command: this._botCommandEntityHandler.bind(this)
    };

    this.getMe()
      .then(res => {
        if (!res.ok) throw new Error(res.description);

        this.data = res.result;
      })
      .catch(err => { throw err });

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
    let event = Object.keys(body)[1];

    if (this._events[event]) {
      this._events[event](body);
    } else {
      console.error("Botogram Error. There is no this event handler:", event);
    }
  }

  _request(method, params) {
    return new Promise((resolve, reject) => {
      request.post({url: this.url + method, formData: params}, (err, res, body) => {
        if (err) return reject(err);

        resolve(JSON.parse(body));
      });
    });
  }

  _prepareFormData(type, data) {
    return new Promise((resolve, reject) => {
      if (Buffer.isBuffer(data)) {
        let file = fileType(data);
        if (!file) return reject(new Error("Botogram Error. Unsupported file type."));

        resolve({
          value: data,
          options: {
            filename: `${type}.${file.ext}`,
            contentType: file.mime
          }
        });
      } else if (fs.existsSync(data)) {        
        resolve({
          value: fs.createReadStream(data),
          options: {
            filename: path.basename(data),
            contentType: mime.lookup(data)
          }
        });
      } else if (isURL(data, {protocols: ["http", "https"]})) {
        let parsedUrl = url.parse(data);

        resolve({
          value: request.get(data),
          options: {
            filename: path.basename(parsedUrl.path),
            contentType: mime.lookup(parsedUrl.path)
          }
        });
      } else {
        resolve(data);
      }
    });

  }
  
  _sendFile(type, params) {
    return new Promise((resolve, reject) => {
      this._prepareFormData(type, params[type])
        .then(file => {
          if (file.value instanceof stream.Stream) {
            file.value.on("response", res => {
              if (res.statusCode >= 400) reject(new Error(`Server respond status ${res.statusCode}.`))
            });
            file.value.on("error", reject);
          }

          params[type] = file;
          return this._request(`send${type}`, params);
        })
        .then(resolve)
        .catch(reject);
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
    return this._sendFile("photo", params);
  }

  sendAudio(params) {
    return this._sendFile("audio", params);
  }

  sendDocument(params) {
    return this._sendFile("document", params);
  }

  sendSticker(params) {
    return this._sendFile("sticker", params);
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

  downloadFileById(params) {
    params = params || {};
    if (!params.destination || typeof params.destination !== "string") 
      return Promise.reject(new TypeError("Destination parameter should be passed."));

    return new Promise((resolve, reject) => {
      this.getFile(params)
        .then(res => {
          if (!res.ok) return resolve(res);
          
          request(`https://api.telegram.org/file/bot${this.token}/${res.result.file_path}`)
            .pipe(fs.createWriteStream(params.destination + "/" + path.basename(res.result.file_path)))
            .on("error", reject)
            .on("response", res => {
              if (res.statusCode !== 200) reject(new Error(`Server respond status ${res.statusCode}.`));

              resolve({ok: true});
            })
        })
    });
  }

  kickChatMember(params) {
    return this._request("kickChatMember", params);
  }

  leaveChat(params) {
    return this._request("leaveChat", params);
  }

  unbanChatMember(params) {
    return this._request("unbanChatMember", params);
  }

  getChat(params) {
    return this._request("getChat", params);
  }

  getChatAdministrators(params) {
    return this._request("getChatAdministrators", params);
  }

  getChatMembersCount(params) {
    return this._request("getChatMembersCount", params);
  }

  getChatMember(params) {
    return this._request("getChatMember", params);
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

  _emit(type, data) {
    if (this.emit(type, data)) {
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

    if (this._events[command] || this._messageTypes.indexOf(command) !== -1) {  // defence of reserved events from any user's invocations
      this._emit("command", entity.message) || this._emit("*", entity.message);
    } else {
      this._emit(command, entity.message) || this._emit("command", entity.message) || this._emit("*", entity.message);
    }
  }

  _logMessage(message) {
    let type = this._messageTypes.filter(type => {
      return message[type];
    })[0];

    console.log(`Botogram => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): ${message[type]}`);
  }
}