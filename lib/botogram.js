"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request2 = require("request");

var _request3 = _interopRequireDefault(_request2);

var _events = require("events");

var _fileType = require("file-type");

var _fileType2 = _interopRequireDefault(_fileType);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _mime = require("mime");

var _mime2 = _interopRequireDefault(_mime);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _validator = require("validator");

var _stream = require("stream");

var _stream2 = _interopRequireDefault(_stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Bot = function (_EventEmitter) {
  _inherits(Bot, _EventEmitter);

  function Bot(token) {
    _classCallCheck(this, Bot);

    if (typeof token !== "string") throw new TypeError("You need to pass a bot token into the constructor.");

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Bot).call(this));

    _this.token = token;
    _this.url = "https://api.telegram.org/bot" + token + "/";
    _this.data = {};
    _this._types = {
      message: _this._messageHandler.bind(_this),
      callback_query: _this._callbackQueryHandler.bind(_this)
    };

    _this._messageTypes = ["text", "photo", "document", "audio", "sticker", "video", "voice", "contact", "location", "venue"];

    _this._messageEntities = {
      bot_command: _this._botCommandEntityHandler.bind(_this)
    };

    _this.getMe().then(function (res) {
      if (!res.ok) throw new Error(res.description);

      _this.data = res.result;
    }).catch(function (err) {
      throw err;
    });

    (_this.listen = function (req, res, next) {
      res.end();
      if (!req.body) throw new Error("Botogram's 'listen' method requires body-parser. Use npm install --save body-parser.");

      next();
      _this._bodyHandler(req.body);
    }).bind(_this);
    return _this;
  }

  _createClass(Bot, [{
    key: "take",
    value: function take(body) {
      this._bodyHandler(body);
    }
  }, {
    key: "_bodyHandler",
    value: function _bodyHandler(body) {
      var event = Object.keys(body)[1];

      if (this._types[event]) {
        this._types[event](body);
      } else {
        console.error("Botogram Error. There is no this event handler:", event);
      }
    }
  }, {
    key: "_request",
    value: function _request(method, params) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _request3.default.post({ url: _this2.url + method, formData: params }, function (err, res, body) {
          if (err) return reject(err);

          resolve(JSON.parse(body));
        });
      });
    }
  }, {
    key: "_prepareFormData",
    value: function _prepareFormData(type, data) {
      return new Promise(function (resolve, reject) {
        if (Buffer.isBuffer(data)) {
          var file = (0, _fileType2.default)(data);
          if (!file) return reject(new Error("Botogram Error. Unsupported file type."));

          resolve({
            value: data,
            options: {
              filename: type + "." + file.ext,
              contentType: file.mime
            }
          });
        } else if (_fs2.default.existsSync(data)) {
          resolve({
            value: _fs2.default.createReadStream(data),
            options: {
              filename: _path2.default.basename(data),
              contentType: _mime2.default.lookup(data)
            }
          });
        } else if ((0, _validator.isURL)(data, { protocols: ["http", "https"] })) {
          var parsedUrl = _url2.default.parse(data);

          resolve({
            value: _request3.default.get(data),
            options: {
              filename: _path2.default.basename(parsedUrl.path),
              contentType: _mime2.default.lookup(parsedUrl.path)
            }
          });
        } else {
          resolve(data);
        }
      });
    }
  }, {
    key: "_sendFile",
    value: function _sendFile(type, params) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3._prepareFormData(type, params[type]).then(function (file) {
          if (file.value instanceof _stream2.default.Stream) {
            file.value.on("response", function (res) {
              if (res.statusCode >= 400) reject(new Error("Server respond status " + res.statusCode + "."));
            });
            file.value.on("error", reject);
          }

          params[type] = file;
          return _this3._request("send" + type, params);
        }).then(resolve).catch(reject);
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
      return this._sendFile("photo", params);
    }
  }, {
    key: "sendAudio",
    value: function sendAudio(params) {
      return this._sendFile("audio", params);
    }
  }, {
    key: "sendDocument",
    value: function sendDocument(params) {
      return this._sendFile("document", params);
    }
  }, {
    key: "sendSticker",
    value: function sendSticker(params) {
      return this._sendFile("sticker", params);
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
    key: "downloadFileById",
    value: function downloadFileById(params) {
      var _this4 = this;

      params = params || {};
      if (typeof params.destination !== "string") return Promise.reject(new TypeError("Destination parameter should be passed."));

      return new Promise(function (resolve, reject) {
        _this4.getFile(params).then(function (res) {
          if (!res.ok) return resolve(res);

          (0, _request3.default)("https://api.telegram.org/file/bot" + _this4.token + "/" + res.result.file_path).pipe(_fs2.default.createWriteStream(params.destination + "/" + _path2.default.basename(res.result.file_path))).on("error", reject).on("response", function (res) {
            if (res.statusCode !== 200) reject(new Error("Server respond status " + res.statusCode + "."));

            resolve({ ok: true });
          });
        });
      });
    }
  }, {
    key: "kickChatMember",
    value: function kickChatMember(params) {
      return this._request("kickChatMember", params);
    }
  }, {
    key: "leaveChat",
    value: function leaveChat(params) {
      return this._request("leaveChat", params);
    }
  }, {
    key: "unbanChatMember",
    value: function unbanChatMember(params) {
      return this._request("unbanChatMember", params);
    }
  }, {
    key: "getChat",
    value: function getChat(params) {
      return this._request("getChat", params);
    }
  }, {
    key: "getChatAdministrators",
    value: function getChatAdministrators(params) {
      return this._request("getChatAdministrators", params);
    }
  }, {
    key: "getChatMembersCount",
    value: function getChatMembersCount(params) {
      return this._request("getChatMembersCount", params);
    }
  }, {
    key: "getChatMember",
    value: function getChatMember(params) {
      return this._request("getChatMember", params);
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
    key: "_emit",
    value: function _emit(type, data) {
      if (this.emit(type, data)) {
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
      this._emit("callback_query", body.callback_query) || this._emit("*", body.callback_query);
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

      console.log("Botogram => " + this.data.first_name + ": [" + message.from.username + "] " + message.from.first_name + " " + message.from.last_name + " (" + message.from.id + "): " + message[type]);
    }
  }]);

  return Bot;
}(_events.EventEmitter);

exports.default = Bot;