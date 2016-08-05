"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

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

var _validator = require("validator");

var _stream = require("stream");

var _stream2 = _interopRequireDefault(_stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Bot = function (_EventEmitter) {
  (0, _inherits3.default)(Bot, _EventEmitter);

  function Bot(token) {
    (0, _classCallCheck3.default)(this, Bot);

    if (typeof token !== "string") throw new TypeError("You need to pass a bot token into the constructor.");

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Bot).call(this));

    _this.token = token;
    _this.url = "https://api.telegram.org/bot" + token + "/";
    _this.data = {};
    _this._eventTypes = {
      message: _this._messageHandler.bind(_this),
      edited_message: _this._editedMessageHandler.bind(_this),
      callback_query: _this._callbackQueryHandler.bind(_this),
      inline_query: _this._inlineQueryHandler.bind(_this),
      chosen_inline_result: _this._chosenInlineResultHandler.bind(_this)
    };

    _this._messageTypes = ["text", "photo", "document", "audio", "sticker", "video", "voice", "contact", "location", "venue", "new_chat_member", "left_chat_member", "new_chat_title", "new_chat_photo", "delete_chat_photo", "group_chat_created", "supergroup_chat_created", "channel_chat_created", "migrate_to_chat_id", "migrate_from_chat_id", "pinned_message"];

    _this._messageEntities = {
      bot_command: _this._botCommandEntityHandler.bind(_this)
    };

    _this.getMe().then(function (res) {
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

  (0, _createClass3.default)(Bot, [{
    key: "take",
    value: function take(body) {
      this._bodyHandler(body);
    }
  }, {
    key: "alert",
    value: function alert() {
      var _this2 = this;

      var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!Array.isArray(params.chat_ids) || !params.chat_ids.length) return _promise2.default.reject({ ok: false, description: "A chat_ids parameter should be passed." });

      var bulk = (+params.bulk || 30) > 30 ? 30 : +params.bulk,
          ms = ((+params.every || 10) < 1 ? 1 : +params.every) * 1000,
          chat_ids = params.chat_ids,
          length = chat_ids.length,
          requests = [],
          interval = void 0,
          i = 0,
          send = function send(resolve, reject) {
        for (var j = 0; j < bulk; j++) {
          if (chat_ids[i]) {
            params.chat_id = chat_ids[i];

            (function (i) {
              console.log("Botogram. Sending alerts " + (i + 1) + " of " + length + "...");
              _this2._request("sendMessage", params).then(function (res) {
                return requests[i] = res;
              }).catch(function (err) {
                return requests[i] = err;
              });
            })(i);

            i++;
          } else {
            var _ret = function () {
              var innerInterval = setInterval(function () {
                if (requests.length === length) {
                  clearInterval(innerInterval);
                  var success = requests.filter(function (req) {
                    return req.ok;
                  });

                  console.log("Botogram. " + success.length + " of " + length + " alerts were successfully sent.");
                  resolve({ ok: true, results: requests });
                }
              }, 1000);

              clearInterval(interval);
              return "break";
            }();

            if (_ret === "break") break;
          }
        }
      };

      delete params.chat_ids;
      delete params.bulk;
      delete params.every;

      return new _promise2.default(function (resolve, reject) {
        send(resolve, reject);
        interval = setInterval(send.bind(_this2, resolve, reject), ms);
      });
    }
  }, {
    key: "_bodyHandler",
    value: function _bodyHandler(body) {
      var event = (0, _keys2.default)(body)[1];

      if (!event) return console.error("Botogram Error: Wrong body was given.");

      if (this._eventTypes[event]) {
        this._eventTypes[event](body);
      } else {
        console.error("Botogram Error: There is no this event handler:", event);
      }
    }
  }, {
    key: "_request",
    value: function _request(method) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var options = {
        url: this.url + method
      };

      if (opts.formData) {
        options.formData = params;
      } else {
        options.headers = { "Content-Type": "application/json" };
        options.body = (0, _stringify2.default)(params);
      }

      return new _promise2.default(function (resolve, reject) {
        _request3.default.post(options, function (err, res, body) {
          if (err) return reject(err);
          if (res.statusCode !== 200) return reject(JSON.parse(body));

          resolve(JSON.parse(body));
        });
      });
    }
  }, {
    key: "_prepareFormData",
    value: function _prepareFormData(type, data) {
      return new _promise2.default(function (resolve, reject) {
        if (Buffer.isBuffer(data)) {
          var file = (0, _fileType2.default)(data);
          if (!file) return reject({ ok: false, description: "Botogram Error: Unsupported file type." });

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
          resolve({
            value: _request3.default.get(data),
            options: {
              filename: _path2.default.basename(data),
              contentType: _mime2.default.lookup(data)
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

      return new _promise2.default(function (resolve, reject) {
        _this3._prepareFormData(type, params[type]).then(function (file) {
          if (file.value instanceof _stream2.default.Stream) {
            file.value.on("response", function (res) {
              if (res.statusCode >= 400) reject({ ok: false, description: "Server respond status " + res.statusCode + "." });
            }).on("error", reject);
          }

          params[type] = file;
          return _this3._request("send" + type, params, { formData: true });
        }).then(resolve).catch(reject);
      });
    }
  }, {
    key: "setWebhook",
    value: function setWebhook(params) {
      var _this4 = this;

      return new _promise2.default(function (resolve, reject) {
        if (params.certificate) {
          _this4._prepareFormData("certificate", params.certificate).then(function (file) {
            if (file.value instanceof _stream2.default.Stream) {
              file.value.on("response", function (res) {
                if (res.statusCode >= 400) reject({ ok: false, description: "Server respond status " + res.statusCode + "." });
              }).on("error", reject);
            }

            params.certificate = file;
            return _this4._request("setWebhook", params, { formData: true });
          }).then(resolve).catch(reject);
        } else {
          _this4._request("setWebhook", params).then(resolve).catch(reject);
        }
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
    value: function downloadFileById() {
      var _this5 = this;

      var params = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (typeof params.destination !== "string") return _promise2.default.reject(new TypeError("A destination parameter should be passed."));

      return new _promise2.default(function (resolve, reject) {
        _this5.getFile(params).then(function (res) {
          if (!res.ok) return resolve(res);

          _request3.default.get("https://api.telegram.org/file/bot" + _this5.token + "/" + res.result.file_path).on("response", function (resp) {
            if (resp.statusCode !== 200) return reject({ ok: false, description: "Server respond status " + resp.statusCode + "." });

            resolve({ ok: true });
          }).on("error", reject).pipe(_fs2.default.createWriteStream(params.destination + "/" + _path2.default.basename(res.result.file_path)));
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
    key: "answerInlineQuery",
    value: function answerInlineQuery(params) {
      return this._request("answerInlineQuery", params);
    }
  }, {
    key: "_emit",
    value: function _emit(type, data, next) {
      if (this.emit(type, data, next)) {
        this._logMessage(data, type);
        return true;
      } else {
        console.log("Botogram => " + this.data.username + "'s on \"" + type + "\" listener is not defined.");
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

      if (!type) {
        console.error("Botogram Error: Unsupported message type. 'Message' event will be emitted instead.");
        return this._emit("message", message, this._emit.bind(this, "*", message)) || this._emit("*", message);
      }

      if (message.entities) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (0, _getIterator3.default)(message.entities), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var entity = _step.value;

            if (this._messageEntities[entity.type]) {
              return this._messageEntities[entity.type]({
                message: message,
                offset: entity.offset,
                length: entity.length
              });
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

      this._emit(type, message, this._emit.bind(this, "message", message, this._emit.bind(this, "*"))) || this._emit("message", message, this._emit.bind(this, "*", message)) || this._emit("*", message);
    }
  }, {
    key: "_editedMessageHandler",
    value: function _editedMessageHandler(body) {
      var message = body.edited_message;

      this._emit("edited_message", message, this._emit.bind(this, "*", message)) || this._emit("*", message);
    }
  }, {
    key: "_callbackQueryHandler",
    value: function _callbackQueryHandler(body) {
      var query = body.callback_query;

      this._emit("callback_query", query, this._emit.bind(this, "*", query)) || this._emit("*", query);
    }
  }, {
    key: "_inlineQueryHandler",
    value: function _inlineQueryHandler(body) {
      var query = body.inline_query;

      this._emit("inline_query", query, this._emit.bind(this, "*", query)) || this._emit("*", query);
    }
  }, {
    key: "_botCommandEntityHandler",
    value: function _botCommandEntityHandler(entity) {
      var message = entity.message,
          command = message.text.substr(entity.offset, entity.length);

      this._emit(command, message, this._emit.bind(this, "command", message, this._emit.bind(this, "*", message))) || this._emit("command", message, this._emit.bind(this, "*", message)) || this._emit("*", message);
    }
  }, {
    key: "_chosenInlineResultHandler",
    value: function _chosenInlineResultHandler(body) {
      var result = body.chosen_inline_result;

      this._emit("chosen_inline_result", result, this._emit.bind(this, "*", result)) || this._emit("*", result);
    }
  }, {
    key: "_logMessage",
    value: function _logMessage(message, type) {
      console.log("Botogram => " + this.data.username + ": [" + message.from.username + "] " + message.from.first_name + " " + message.from.last_name + " (" + message.from.id + "): <" + type + "> " + (message[type] || message.text || message.data || message.query).replace(/\n/g, " "));
    }
  }]);
  return Bot;
}(_events.EventEmitter);

exports.default = Bot;