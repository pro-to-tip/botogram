import request from "request";
import {EventEmitter} from "events";
import fileType from "file-type";
import fs from "fs";
import path from "path";
import mime from "mime";
import {isURL} from "validator";
import stream from "stream";


export default class Bot extends EventEmitter {
  constructor(token) {
    if (typeof token !== "string") throw new TypeError("You need to pass a bot token into the constructor.");
    
    super();
    this.token = token;
    this.url = `https://api.telegram.org/bot${token}/`;
    this.data = {};
    this._types = {
      message: this._messageHandler.bind(this),
      edited_message: this._editedMessageHandler.bind(this),
      callback_query: this._callbackQueryHandler.bind(this),
      inline_query: this._inlineQueryHandler.bind(this),
      chosen_inline_result: this._chosenInlineResultHandler.bind(this)
    };

    this._messageTypes = [
      "text", "photo", "document", "audio", "sticker", "video", "voice", "contact", "location", "venue",
      "new_chat_member", "left_chat_member", "new_chat_title", "new_chat_photo", "delete_chat_photo",
      "group_chat_created", "supergroup_chat_created", "channel_chat_created", "migrate_to_chat_id",
      "migrate_from_chat_id", "pinned_message"
    ];

    this._messageEntities = {
      bot_command: this._botCommandEntityHandler.bind(this)
    };

    this.getMe()
      .then(res => {
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

  alert(params) {
    params = params || {};

    if (!Array.isArray(params.chat_ids)) return Promise.reject(new TypeError("A chat_ids parameter should be passed."));

    let chat_ids = params.chat_ids;
    delete params.chat_ids;
    let requests = [];
    let i = 0;
    let length = chat_ids.length;

    return new Promise((resolve, reject) => {
      let interval = setInterval(() => {
        for (; i < length; i++) { 
          params.chat_id = chat_ids[i];

          if (!(i % 29) && i !== 0) {
            this._request("sendMessage", params)
              .then(res => requests[i] = res)
              .catch(err => requests[i] = err);
            i += 1;
            break;
          } else { 
            this._request("sendMessage", params)
              .then(res => requests[i] = res)
              .catch(err => requests[i] = err);
          }
  
          if (i === length - 1) { 
            clearInterval(interval);
            resolve(requests);
          }
        }
      }, 10000);
    });
  }

  _bodyHandler(body) {
    let event = Object.keys(body)[1];

    if (this._types[event]) {
      this._types[event](body);
    } else {
      console.error("Botogram Error. There is no this event handler:", event);
    }
  }

  _request(method, params, opts) {
    params = params || {};
    opts = opts || {};
    let options = {
      url: this.url + method
    };

    if (opts.formData) {
      options.formData = params;
    } else { 
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(params);
    }

    return new Promise((resolve, reject) => {
      request.post(options, (err, res, body) => {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(new Error(body));

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
        resolve({
          value: request.get(data),
          options: {
            filename: path.basename(data),
            contentType: mime.lookup(data)
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
            file.value
              .on("response", res => {
                if (res.statusCode >= 400) reject(new Error(`Server respond status ${res.statusCode}.`))
              })
              .on("error", reject);
          }

          params[type] = file;
          return this._request(`send${type}`, params, { formData: true });
        })
        .then(resolve)
        .catch(reject);
    });
  }

  setWebhook(params) { 
    return new Promise((resolve, reject) => {
      if (params.certificate) {
        this._prepareFormData("certificate", params.certificate)
          .then(file => {
            if (file.value instanceof stream.Stream) {
              file.value
                .on("response", res => {
                  if (res.statusCode >= 400) reject(new Error(`Server respond status ${res.statusCode}.`))
                })
                .on("error", reject);
            }

            params.certificate = file;
            return this._request(`setWebhook`, params, { formData: true });
          })
          .then(resolve)
          .catch(reject);
      } else { 
        this._request(`setWebhook`, params)
          .then(resolve)
          .catch(reject);
      }
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
    if (typeof params.destination !== "string") 
      return Promise.reject(new TypeError("A destination parameter should be passed."));

    return new Promise((resolve, reject) => {
      this.getFile(params)
        .then(res => {
          if (!res.ok) return resolve(res);
          
          request.get(`https://api.telegram.org/file/bot${this.token}/${res.result.file_path}`)
            .on("response", res => {
              if (res.statusCode !== 200) reject(new Error(`Server respond status ${res.statusCode}.`));

              resolve({ ok: true });
            })
            .on("error", reject)
            .pipe(fs.createWriteStream(params.destination + "/" + path.basename(res.result.file_path)));
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

  answerInlineQuery(params) { 
    return this._request("answerInlineQuery", params);
  }

  _emit(type, data) {
    if (this.emit(type, data)) {
      this._logMessage(data, type);
      return true;
    } else {
      console.log(`Botogram => ${this.data.username}'s on "${type}" listener is not defined.`);
      return false;
    }
  }

  _messageHandler(body) {
    let message = body.message,
      type = this._messageTypes.filter(type => {
        return message[type];
      })[0];
    
    if (!type) return this._emit("message", message) || this._emit("*", message);

    if (message.entities) {
      for (let entity of message.entities) {
        if (this._messageEntities[entity.type]) {
          return this._messageEntities[entity.type]({
            message,
            offset: entity.offset,
            length: entity.length
          });
        }
      }
    }

    this._emit(type, message) || this._emit("message", message) || this._emit("*", message);
  }

  _editedMessageHandler(body) { 
    this._emit("edited_message", body.edited_message) || this._emit("*", body.edited_message);
  }

  _callbackQueryHandler(body) {
    this._emit("callback_query", body.callback_query) || this._emit("*", body.callback_query);
  }

  _inlineQueryHandler(body) {
    this._emit("inline_query", body.inline_query) || this._emit("*", body.inline_query);
  }

  _botCommandEntityHandler(entity) {
    let command = entity.message.text.substr(entity.offset, entity.length).slice(1);

    if (this._types[command] || this._messageTypes.indexOf(command) !== -1) {  // defence of reserved events from any user's invocations
      this._emit("command", entity.message) || this._emit("*", entity.message);
    } else {
      this._emit(command, entity.message) || this._emit("command", entity.message) || this._emit("*", entity.message);
    }
  }

  _chosenInlineResultHandler(message) { 
    this._emit("chosen_inline_result", message.chosen_inline_result) || this._emit("*", message.chosen_inline_result);
  }

  _logMessage(message, type) {
    console.log(`Botogram => ${this.data.first_name}: [${message.from.username}] ${message.from.first_name} ${message.from.last_name} (${message.from.id}): <${type}> ${(message[type] || message.text || message.data || message.query)}`);
  }
}