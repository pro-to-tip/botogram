### Example usage with [Express](https://www.npmjs.com/package/express) and self-signed certificates:

```javascript
const https = require('https');
const fs = require('fs');
const app = require('express')();
const bodyParser = require('body-parser');
const Botogram = require('botogram');
const bot = new Botogram('<TOKEN>');

app.use(bodyParser.json());

app.post('/', bot.listen);

bot.setWebhook({
  url: 'https://<YOURIPORDOMAINHERE>:8443',
  certificate: 'cert.pem'
});

bot.on('*', event => {
  bot.sendMessage({
    text: 'Echo',
    chat_id: event.from.id
  })
});

const sslOptions = {
  key: fs.readFileSync('key.key'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: 'test'
};

https.createServer(sslOptions, app).listen(8443);
```

> Make sure that 8443 port is open on your computer. If you need to generate your own certificates see [this](https://core.telegram.org/bots/self-signed).