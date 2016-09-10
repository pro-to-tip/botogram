export function bodyHandler(body = {}) {
  let event = Object.keys(body)[1];

  if (typeof event !== 'string') 
    throw new Error('The wrong body was given.');

  if (this._eventTypes[event]) {
    this._eventTypes[event](body);
  } else {
    console.error('There is no this event handler:', event);
  }
}

export function messageHandler(body) {
  let message = body.message,
    type = this._messageTypes.filter(type => {
      return message[type];
    })[0];
  
  message.echo = text => {
    return this.sendMessage({
      chat_id: message.from.id,
      text,
      disable_web_page_preview: true
    });
  };
  
  if (!type) {
    console.error('Unsupported message type. "Message" event will be emitted instead.');
    return this._emitByPriority(2, 'message', message);
  }

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
  
  this._emitByPriority(1, 'message', message, type);
}

export function editedMessageHandler(body) {
  let message = body.edited_message;
  
  message.echo = text => {
    return this.sendMessage({
      chat_id: message.from.id,
      text,
      disable_web_page_preview: true
    });
  };

  this._emitByPriority(2, 'edited_message', message);
}

export function callbackQueryHandler(body) {
  let query = body.callback_query;
  
  query.echo = text => {
    return this.answerCallbackQuery({
      callback_query_id: query.id,
      text
    });
  };

  this._emitByPriority(2, 'callback_query', query);
}

export function inlineQueryHandler(body) {
  let query = body.inline_query;
  
  query.echo = results => {
    return this.answerInlineQuery({
      inline_query_id: query.id,
      results: [
        {
          type: 'article',
          title: results,
          id: query.id,
          input_message_content: {
            message_text: results
          }
        }
      ]
    });
  };
    
  this._emitByPriority(2, 'inline_query', query);
}

export function botCommandEntityHandler(entity) {
  let message = entity.message,
    command = message.text.substr(entity.offset, entity.length);
    
  message.echo = text => {
    return this.sendMessage({
      chat_id: message.from.id,
      text,
      disable_web_page_preview: true
    });
  };
    
  this._emitByPriority(1, 'command', message, command);  
}

export function chosenInlineResultHandler(body) {
  let result = body.chosen_inline_result;
  
  result.echo = text => {
    return this.sendMessage({
      chat_id: result.from.id,
      text,
      disable_web_page_preview: true
    });
  };

  this._emitByPriority(2, 'chosen_inline_result', result);
}

export default {
  bodyHandler,
  messageHandler,
  editedMessageHandler,
  callbackQueryHandler,
  inlineQueryHandler,
  botCommandEntityHandler,
  chosenInlineResultHandler
};