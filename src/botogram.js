import request from 'request';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { 
  bodyHandler, messageHandler, editedMessageHandler, callbackQueryHandler,
  inlineQueryHandler, botCommandEntityHandler, chosenInlineResultHandler 
} from './handlers';
import { apiRequest, prepareFormData, sendFile, logEvent } from './utils';


export default class Bot extends EventEmitter {
  constructor(token) {
    if (typeof token !== 'string') 
      throw new TypeError('You must pass a bot token into the constructor.');
    
    super();
    this.token = token;
    this.data = {};
    this._userMilestone = {};
    this._milestones = {};
    
    this.milestones = {
      on: (event, callback) => {
        let milestones = Object.keys(this._milestones);
        
        for (let milestone of milestones) {
          this._milestones[milestone].on(event, callback);
        }
        
        this.on(event, callback);
      }
    };
    
    this._eventTypes = {
      message: messageHandler.bind(this),
      edited_message: editedMessageHandler.bind(this),
      callback_query: callbackQueryHandler.bind(this),
      inline_query: inlineQueryHandler.bind(this),
      chosen_inline_result: chosenInlineResultHandler.bind(this)
    };

    this._messageTypes = [
      'text', 'photo', 'document', 'audio', 'sticker', 'video', 'voice', 'contact', 
      'location', 'venue', 'new_chat_member', 'left_chat_member', 'new_chat_title', 
      'new_chat_photo', 'delete_chat_photo', 'group_chat_created', 'supergroup_chat_created', 
      'channel_chat_created', 'migrate_to_chat_id', 'migrate_from_chat_id', 'pinned_message'
    ];

    this._messageEntities = {
      bot_command: botCommandEntityHandler.bind(this)
    };

    this.getMe()
      .then(res => {
        this.data = res.result;
      })
      .catch(console.error);
      
    this._alert = {
      interval: null,
      resolve: null,
      reject: null,
      results: null,
      reqs: 0,
      resps: 0,
      send: (params, i) => {
        console.log(`Sending alerts... ${i + 1} of ${this._alert.results.length}`);
        this._alert.reqs++;
        
        apiRequest('sendMessage', { params, token: this.token })
          .then(res => { this._alert.results[i] = res; this._alert.incResps(); })
          .catch(err => { this._alert.results[i] = err; this._alert.incResps(); });
      },
      getSuccessCount: () => { 
        return this._alert.results.filter(result => { 
          result = result || {}; 
          return result.ok;
        }).length;
      },
      setDefaultProps: () => {
        this._alert.interval = null;
        this._alert.resolve = null;
        this._alert.reject = null;
        this._alert.results = null;
        this._alert.reqs = 0;
        this._alert.resps = 0;
      },
      incResps: () => {
        this._alert.resps++;
        let { interval, reqs, resps, results } = this._alert;
        
        if (interval) {
          if (resps === results.length) 
            this.emit('_alert_done');
        } else {
          if (resps === reqs) 
            this.emit('_alert_canceled');
        }
      }
    };
    
    this.on('_alert_done', () => {
      let { getSuccessCount, results, resolve, setDefaultProps } = this._alert,
        description = `Done! ${getSuccessCount()} of ${results.length} alerts have been successfully sent.`;
      
      console.log(description);
      resolve({ ok: true, description, result: results });
      setDefaultProps();
    });
    
    this.on('_alert_canceled', () => {
      let { getSuccessCount, results, reject, setDefaultProps } = this._alert,
        description = `Canceled. ${getSuccessCount()} of ${results.length} alerts have been successfully sent.`;
      
      reject({ 
        ok: false, 
        description, 
        result: results 
      });
      
      console.log(description);
      setDefaultProps();
    });
      
    this.listen = this.listen.bind(this);
  }
  
  listen(req = {}, res = {}, next) {
    if (typeof req.body !== 'object' || typeof res.end !== 'function' || typeof next !== 'function') 
      throw new Error('Botogram\'s "listen" middleware requires body-parser. Use npm install --save body-parser.');
    
    res.end();
    next();
    bodyHandler.call(this, req.body);
  }
  
  take(body) {
    bodyHandler.call(this, body);
  }
  
  milestone(name, callback) {
    if (name === 'source') 
      throw new TypeError('"source" is a reserved name for the main milestone.');
    
    let milestone = new EventEmitter();
    this._milestones[name] = milestone;
    callback(milestone);
  }
  
  getUserMilestone(id) {
    return this._userMilestone[id] || 'source';
  }
  
  setUserMilestone(milestone, id) {
    if (!this._milestones[milestone] && milestone !== 'source') {
      console.error(`Warning. ${this.data.username} doesn't have a "${milestone}" milestone.`);
    }
    
    this._userMilestone[id] = milestone;
  }

  alert(params = {}) {  
    if (!Array.isArray(params.chat_ids) || !params.chat_ids.length) 
      return Promise.reject({ ok: false, description: 'A chat_ids parameter must be passed.' });

    let { chat_ids, bulk, every } = params,
      blk = (+bulk || 30) >= 30 ? 30 : +bulk <= 0 ? 30 : +bulk,
      ms = ((+every || 10) < 1 ? 1 : +every || 10) * 1000,
      i = 0,
      send = () => {
        for (let j = 0; j < blk; j++) {
          if (chat_ids[i]) { 
            params.chat_id = chat_ids[i];
            this._alert.send(params, i);
            i++;
          } else {
            clearInterval(this._alert.interval);
            break;       
          }
        }
      };
    
    delete params.chat_ids;
    delete params.bulk;
    delete params.every;

    return new Promise((resolve, reject) => {
      this._alert.resolve = resolve;
      this._alert.reject = reject;
      this._alert.results = new Array(chat_ids.length).fill(null);
      this._alert.interval = setInterval(send, ms);
      send();
    });
  }
  
  cancelAlert() {
    if (this._alert.interval === null) 
      return console.error('Alert hasn\'t been started yet.');
    
    console.log('Canceling the alert...');
    clearInterval(this._alert.interval);
    this._alert.interval = null;
  }

  setWebhook(params) { 
    if (params.certificate) {
      return prepareFormData('certificate', params.certificate)
        .then(formData => {
          params.certificate = formData;
          return apiRequest('setWebhook', { params, token: this.token, formData: 'certificate' });
        });
    } else { 
      return apiRequest('setWebhook', { params, token: this.token });
    }
  }

  getMe() {
    return apiRequest('getMe', { token: this.token });
  }

  sendMessage(params) {
    return apiRequest('sendMessage', { params, token: this.token });
  }

  forwardMessage(params) {
    return apiRequest('forwardMessage', { params, token: this.token });
  }

  sendPhoto(params) {
    return sendFile('photo', { params, token: this.token });
  }

  sendAudio(params) {
    return sendFile('audio', { params, token: this.token });
  }

  sendDocument(params) {
    return sendFile('document', { params, token: this.token });
  }

  sendSticker(params) {
    return sendFile('sticker', { params, token: this.token });
  }

  sendVideo(params) {
    return sendFile('video', { params, token: this.token });
  }

  sendVoice(params) {
    return sendFile('voice', { params, token: this.token });
  }

  sendLocation(params) {
    return apiRequest('sendLocation', { params, token: this.token });
  }

  sendVenue(params) {
    return apiRequest('sendVenue', { params, token: this.token });
  }

  sendContact(params) {
    return apiRequest('sendContact', { params, token: this.token });
  }

  sendChatAction(params) {
    return apiRequest('sendChatAction', { params, token: this.token });
  }

  getUserProfilePhotos(params) {
    return apiRequest('getUserProfilePhotos', { params, token: this.token });
  }

  getFile(params) {
    return apiRequest('getFile', { params, token: this.token });
  }

  downloadFileById(params = {}) {
    return new Promise((resolve, reject) => {
      if (typeof params.destination !== 'string') 
        throw { ok: false, description: 'A destination parameter must be passed.' };
      
      this.getFile(params)
        .then(res => {
          let file_path = params.destination + '/' + path.basename(res.result.file_path),
            writable = fs.createWriteStream(file_path)
              .on('finish', () => {
                delete res.result.file_id;
                res.result.file_path = file_path;
                resolve(res);
              })
              .on('error', err => {
                reject({ ok: false, description: err.message });
              });
          
          request(`https://api.telegram.org/file/bot${this.token}/${res.result.file_path}`)
            .on('response', res => {
              if (res.statusCode !== 200) 
                reject({ ok: false, description: `Server responded status ${res.statusCode}.` });
            })
            .on('error', err => {
              reject({ ok: false, description: err.message });
            })
            .pipe(writable);
        })
        .catch(reject);
    });
  }

  kickChatMember(params) {
    return apiRequest('kickChatMember', { params, token: this.token });
  }

  leaveChat(params) {
    return apiRequest('leaveChat', { params, token: this.token });
  }

  unbanChatMember(params) {
    return apiRequest('unbanChatMember', { params, token: this.token });
  }

  getChat(params) {
    return apiRequest('getChat', { params, token: this.token });
  }

  getChatAdministrators(params) {
    return apiRequest('getChatAdministrators', { params, token: this.token });
  }

  getChatMembersCount(params) {
    return apiRequest('getChatMembersCount', { params, token: this.token });
  }

  getChatMember(params) {
    return apiRequest('getChatMember', { params, token: this.token });
  }

  answerCallbackQuery(params) {
    return apiRequest('answerCallbackQuery', { params, token: this.token });
  }

  editMessageText(params) {
    return apiRequest('editMessageText', { params, token: this.token });
  }

  editMessageCaption(params) {
    return apiRequest('editMessageCaption', { params, token: this.token });
  }

  editMessageReplyMarkup(params) {
    return apiRequest('editMessageReplyMarkup', { params, token: this.token });
  }

  answerInlineQuery(params) { 
    return apiRequest('answerInlineQuery', { params, token: this.token });
  }
 
  _emit(event, data, type, next) {
    if (type.startsWith('/')) type = 'command';
    
    let milestone = this.getUserMilestone(data.from.id),
      emitter = this._milestones[milestone] || this;
    
    if (emitter.emit(event, data, next)) {
      logEvent.call(this, data, type);
      return true;
    } else {
      console.log(`${this.data.username}'s "${event}" listener is not defined in a "${milestone}" milestone.`);
      return false;
    }
  }
  
  _emitByPriority(priority, event, data, type) {
    if (priority === 1) {
      this._emit(type, data, type, this._emit.bind(this, event, data, type, this._emit.bind(this, '*', data, type))) ||
        this._emit(event, data, type, this._emit.bind(this, '*', data, type)) ||
        this._emit('*', data, type);
    } else if (priority === 2) {
      this._emit(event, data, event, this._emit.bind(this, '*', data, event)) || 
        this._emit('*', data, event);
    }
  }
}