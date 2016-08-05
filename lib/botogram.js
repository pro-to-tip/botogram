"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bot = function () {
  function Bot(token) {
    var _this = this;

    _classCallCheck(this, Bot);

    this.token = token;
    this.url = "https://api.telegram.org/bot" + token + "/";
    this.data = {};
    this._emitter = new _events.EventEmitter();

    this._types = {
      message: this._messageHandler.bind(this),
      callback_query: this._callbackQueryHandler.bind(this)
    };

    this._messageTypes = ["text", "photo", "document", "audio", "sticker", "video", "voice", "contact", "location", "venue"];

    this._messageEntities = {
      bot_command: this._botCommandEntityHandler.bind(this)
    };

    this.getMe().then(function (data) {
      _this.data = data.result;
    }).catch(function (err) {
      throw new Error(err);
    });

    (this.listen = function (req, res, next) {
      res.end();
      if (!req.body) throw new Error("Botogram's 'listen' method requires body-parser. Use npm install --save body-parser.");

      next();
      _this._bodyHandler(req.body);
    }).bind(this);
  }

  _createClass(Bot, [{
    key: "take",
    value: function take(body) {
      this._bodyHandler(body);
    }
  }, {
    key: "_bodyHandler",
    value: function _bodyHandler(body) {
      var type = Object.keys(body)[1];

      if (this._types[type]) {
        this._types[type](body);
      } else {
        console.error("Botogram Error. There is no this message handler:", type);
      }
    }
  }, {
    key: "_request",
    value: function _request(method, params) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        (0, _axios2.default)(_this2.url + method, params).then(function (res) {
          resolve(res.data);
        }).catch(function (err) {
          reject(err.data);
        });
      });
    }
  }, {
    key: "getMe",
    value: function getMe() {
      return this._request("getMe");
    }
  }, {
    key: "sendMessage",
    value: function sendMessage(params) {
      return this._request("sendMessage", params);
    }
  }, {
    key: "forwardMessage",
    value: function forwardMessage(params) {
      return this._request("forwardMessage", params);
    }
  }, {
    key: "sendPhoto",
    value: function sendPhoto(params) {
      return this._request("sendPhoto", params);
    }
  }, {
    key: "sendAudio",
    value: function sendAudio(params) {
      return this._request("sendAudio", params);
    }
  }, {
    key: "sendDocument",
    value: function sendDocument(params) {
      return this._request("sendDocument", params);
    }
  }, {
    key: "sendSticker",
    value: function sendSticker(params) {
      return this._request("sendSticker", params);
    }
  }, {
    key: "sendVideo",
    value: function sendVideo(params) {
      return this._request("sendVideo", params);
    }
  }, {
    key: "sendVoice",
    value: function sendVoice(params) {
      return this._request("sendVoice", params);
    }
  }, {
    key: "sendLocation",
    value: function sendLocation(params) {
      return this._request("sendLocation", params);
    }
  }, {
    key: "sendVenue",
    value: function sendVenue(params) {
      return this._request("sendVenue", params);
    }
  }, {
    key: "sendContact",
    value: function sendContact(params) {
      return this._request("sendContact", params);
    }
  }, {
    key: "sendChatAction",
    value: function sendChatAction(params) {
      return this._request("sendChatAction", params);
    }
  }, {
    key: "getUserProfilePhotos",
    value: function getUserProfilePhotos(params) {
      return this._request("getUserProfilePhotos", params);
    }
  }, {
    key: "getFile",
    value: function getFile(params) {
      return this._request("getFile", params);
    }
  }, {
    key: "kickChatMember",
    value: function kickChatMember(params) {
      return this._request("kickChatMember", params);
    }
  }, {
    key: "unbanChatMember",
    value: function unbanChatMember(params) {
      return this._request("unbanChatMember", params);
    }
  }, {
    key: "answerCallbackQuery",
    value: function answerCallbackQuery(params) {
      return this._request("answerCallbackQuery", params);
    }
  }, {
    key: "editMessageText",
    value: function editMessageText(params) {
      return this._request("editMessageText", params);
    }
  }, {
    key: "editMessageCaption",
    value: function editMessageCaption(params) {
      return this._request("editMessageCaption", params);
    }
  }, {
    key: "editMessageReplyMarkup",
    value: function editMessageReplyMarkup(params) {
      return this._request("editMessageReplyMarkup", params);
    }
  }, {
    key: "on",
    value: function on(event, callback) {
      this._emitter.on(event, callback);
    }
  }, {
    key: "_emit",
    value: function _emit(type, data) {
      if (this._emitter.emit(type, data)) {
        this._logMessage(data);
        return true;
      } else {
        console.log(this.data.username + "'s on \"" + type + "\" listener is not defined.");
        return false;
      }
    }
  }, {
    key: "_messageHandler",
    value: function _messageHandler(body) {
      var message = body.message,
          type = this._messageTypes.filter(function (type) {
        return message[type];
      })[0];

      if (message.entities) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = message.entities[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entity = _step.value;

            if (this._messageEntities[entity.type]) {
              this._messageEntities[entity.type]({
                message: message,
                offset: entity.offset,
                length: entity.length
              });

              return;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      this._emit(type, body.message) || this._emit("message", body.message) || this._emit("*", body.message);
    }
  }, {
    key: "_callbackQueryHandler",
    value: function _callbackQueryHandler(body) {
      this._emit("callback_query", body.callback_query) || this._emit("*", body.message);
    }
  }, {
    key: "_botCommandEntityHandler",
    value: function _botCommandEntityHandler(entity) {
      var command = entity.message.text.substr(entity.offset, entity.length).slice(1);

      if (this._types[command] || this._messageTypes.indexOf(command) !== -1) {
        // defence of reserved events from any user's invocations
        this._emit("command", entity.message) || this._emit("*", entity.message);
      } else {
        this._emit(command, entity.message) || this._emit("command", entity.message) || this._emit("*", entity.message);
      }
    }
  }, {
    key: "_logMessage",
    value: function _logMessage(message) {
      var type = this._messageTypes.filter(function (type) {
        return message[type];
      })[0];

      console.log("(" + new Date().toUTCString() + ") => " + this.data.first_name + ": [" + message.from.username + "] " + message.from.first_name + " " + message.from.last_name + " (" + message.from.id + "): " + message[type]);
    }
  }]);

  return Bot;
}();

exports.default = Bot;