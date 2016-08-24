# botogram
An elegant microframework for creation of Webhook-based Telegram Bots

### Example usage with [Express](https://www.npmjs.com/package/express):

```javascript
const Bot = require('botogram');
const bodyParser = require('body-parser');
const app = require('express')();

app.use(bodyParser.json());

let bot = new Bot('<TOKEN>');
let bot2 = new Bot('<TOKEN>');

// there are two ways of handling incoming requests to the bots:
app.post('/bot', bot.listen); // this one requires body-parser

// or you can manually pass a body straight into bot's "take" method:
app.post('/bot2', (req, res) => {
  bot2.take(req.body);
  res.end();
});

// listening to all incoming events:
bot.on('*', event => {
  event.echo('Echo');
});

// you can set a webhook up if it hasn't done yet
bot.setWebhook({
  url: `https://${process.env.IP}/bot`, // url of current machine with open ports
  certificate: 'cert.pem' // it only needs if you want to set a self-signed ssl certificate
});

app.listen(process.env.PORT);
```
> Notice that Webhook will only work via HTTPS, so you need to have an SSL-signed url. 
For more information see [this](https://core.telegram.org/bots/api#setwebhook).
Example usage with self-signed certificates can be found [here](https://github.com/drvirtuozov/botogram/blob/master/docs/selfsigned.md).


# Event Types and Priority

|                                  First Priority                                 |    Second Priority   | Third Priority |
|:-------------------------------------------------------------------------------:|:--------------------:|:--------------:|
| text, photo, document, audio,  sticker, video, voice, contact,  location, venue |        message       |        *       |
|                                                                                 |    edited_message    |        *       |
|                                 < CUSTOM_COMMAND >                              |        command       |        *       |
|                                                                                 |    callback_query    |        *       |
|                                                                                 |     inline_query     |        *       |
|                                                                                 | chosen_inline_result |        *       |

Explanation: if a requested event wasn't defined, a next event will be emitted by priority and so on. 

# Event Arguments

Every event receives two arguments: the first one is the event body itself, the second one is the next event by priority.
```javascript
bot.on('text', (message, next) => {
  next();
});

bot.on('message', (message, next) => {
  next();
});

bot.on('*', event => {
  event.echo('A message passed from first to last event priority.');
});
```
Every event body has a simple text echo method which responds to a user with the same event type that came (message => message, callback_query => callback_query, etc.).

# Milestones

Milestones allow you to handle user actions elegantly and respond to them according to their actions. Milestones define the visibility of events and action stages of users. Due to ```bot.setUserMilestone``` function, it's possible to convey a user from milestone to milestone.

```javascript
bot.milestone('action', milestone => {
  milestone.on('text', message => {
    message.echo('A message from action milestone');
  });
  
  milestone.on('/cancel', message => {
    message.echo('Switching back to source milestone');
    bot.setUserMilestone('source', message.from.id);
  });
});

bot.on('text', message => {
  message.echo('Source milestone');
});

bot.on('/action', message => {
  message.echo('Switching to action milestone');
  bot.setUserMilestone('action', message.from.id);
});

bot.milestones.on('/all', message => {
  message.echo('Works in every milestone');
});
```
Source is a name of the main initial milestone. All the events defined via ```bot.on``` are events of a source milestone. Events defined via ```bot.milestones.on``` will be available from any milestone.

# The API

### Botogram Methods:

- on
- take
- listen ```//middleware```
- milestone
- milestones.on
- setUserMilestone
- getUserMilestone => String
- alert => Promise
- downloadFileById => Promise

### Telegram Supported Methods:
- getMe => Promise
- setWebhook(```{ url: String, certificate: 'file_path' || 'url' }```) => Promise 
- sendMessage(```{ chat_id: String || Number, text: String }```) => Promise
- forwardMessage(```{ chat_id: Number, from_chat_id: Number, message_id: Number }```) => Promise
- sendPhoto(```{ chat_id: Number, photo: 'file_path' || 'url' || 'file_id' || Buffer }```) => Promise
- sendAudio(```{ chat_id: Number, audio: 'file_path' || 'url' || 'file_id' || Buffer }```) => Promise
- sendDocument(```{ chat_id: Number, document: 'file_pat' || 'url' || 'file_id' || Buffer }```) => Promise
- sendSticker(```{ chat_id: Number, sticker: 'file_path' || 'url' || 'file_id' || Buffer }```) => Promise
- sendVideo(```{ chat_id: Number, video: 'file_path' || 'url' || 'file_id' || Buffer }```) => Promise
- sendVoice(```{ chat_id: Number, voice: 'file_path' || 'url' || 'file_id' || Buffer }```) => Promise
- sendLocation(```{ chat_id: Number, latitude: Number, longitude: Number }```) => Promise
- sendVenue(```{ chat_id: Number, latitude: Number, longitude: Number, title: String, address: String }```) => Promise
- sendContact(```{ chat_id: Number, phone_number: String, first_name: String }```) => Promise
- sendChatAction(```{ chat_id: Number, action: String }```) => Promise
- getUserProfilePhotos(```{ user_id: Number }```) => Promise
- getFile(```{ file_id: String }```) => Promise
- kickChatMember(```{ chat_id: Number, user_id: Number }```) => Promise
- leaveChat(```{ chat_id: Number }```) => Promise
- unbanChatMember(```{ chat_id: Number, user_id: Number }```) => Promise
- getChat(```{ chat_id: Number }```) => Promise
- getChatAdministrators(```{ chat_id: Number }```) => Promise
- getChatMembersCount(```{ chat_id: Number }```) => Promise
- getChatMember(```{ chat_id: Number, user_id: Number }```) => Promise
- answerCallbackQuery(```{ callback_query_id: Number }```) => Promise
- editMessageText(```{ chat_id: Number, message_id: Number, text: String }```) => Promise
- editMessageCaption(```{ chat_id: Number, message_id: Number, caption: String }```) => Promise
- editMessageReplyMarkup(```{ chat_id: Number, message_id: Number, reply_markup: Object }```) => Promise
- answerInlineQuery(```{ inline_query_id: Number, results: [Object] }```) => Promise

See [The Official Documentation](https://core.telegram.org/bots/api) for more information about these methods and how to use them.

# alert

Use this method to send a message to all users. Returns promise with an array of results. Note that Telegram API has restrictions sending more than 30 messages per 1 second. For optimal settings see [this](https://core.telegram.org/bots/faq#broadcasting-to-users).

| Parameters | Type   | Required | Description                                               |
|------------|--------|----------|-----------------------------------------------------------|
| chat_ids   | Array  | Yes      | Array of chat ids                                         |
| text       | String | Yes      | Text of the message to be sent                            |
| bulk       | Number | Optional | Chat ids quantity per time. Default: 30, Max: 30, Min: 1  |
| every      | Number | Optional | Interval in seconds. Default: 10, Min: 1                  |

# downloadFileById

Use this method to download any files by id.

| Parameters  | Type   | Required | Description                 |
|-------------|--------|----------|-----------------------------|
| file_id     | String | Yes      | File identifier to download |
| destination | String | Yes      | File system path            |