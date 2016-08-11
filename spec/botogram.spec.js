"use strict";

const fs = require("fs");
const path = require("path");
const Bot = require("../");
const chat_id = process.env.CHAT_ID;
const bot = new Bot(process.env.TOKEN);

describe("Bot", () => {  
  describe("getMe", () => {
    it("has to get some bot's data", done => {
      bot.getMe()
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });
  
  describe("setWebhook", () => {
    it("has to set a webhook with certificate", done => {
      bot.setWebhook({
        url: "https://github.com/drvirtuozov/botogram",
        certificate: `${__dirname}/cert.pem`
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });

  describe("sendMessage", () => {
    it("has to send a message", done => {
      bot.sendMessage({
        text: "sendMessage",
        chat_id
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });

  describe("forwardMessage", () => {
    it("has to forward a message", done => {
      bot.sendMessage({
        text: "forwardMessage",
        chat_id
      })
        .then(res => {
          let message_id = res.result.message_id;

          bot.forwardMessage({
            from_chat_id: chat_id,
            message_id,
            chat_id
          })
            .then(res => {
              expect(res.ok).toBe(true);
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
  });

  describe("sendDocument", () => {
    it("has to send a document from a buffer", done => {
      fs.readFile(`${__dirname}/github-git-cheat-sheet.pdf`, (err, document) => {
        if (err) return done(err);

        bot.sendDocument({
          document,
          chat_id
        })
          .then(res => {
            expect(res.ok).toBe(true);
            done();
          })
          .catch(done);
      });
    });

    it("has to send a document from a file path", done => {
      bot.sendDocument({
        document: `${__dirname}/github-git-cheat-sheet.pdf`,
        chat_id
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });

    it("has to send a document from a url", done => {
      bot.sendDocument({
        document: "https://services.github.com/kit/downloads/github-git-cheat-sheet.pdf",
        chat_id
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
    
    it("has to get a 404 error", done => {
      bot.sendDocument({
        document: "https://services.github.com/kit/downloads/lol.pdf",
        chat_id
      })
        .then(done)
        .catch(err => {
          expect(err.ok).toBe(false);
          done();
        });
    });

    it("has to send a document from a file id", done => {
      bot.sendDocument({
        document: "BQADAgADCgADqMZ2C01OELUb82w5Ag",
        chat_id
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });

  describe("getFile", () => {
    it("has to get a file", done => {
      bot.getFile({
        file_id: "BQADAgADCgADqMZ2C01OELUb82w5Ag"
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });

  describe("downloadFileById", () => {
    it("has to download a file by id", done => {
      bot.downloadFileById({
        file_id: "BQADAgADCgADqMZ2C01OELUb82w5Ag",
        destination: __dirname
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
          fs.unlinkSync(__dirname + "/" + path.basename(res.result.file_path));
        })
        .catch(done);
    });
  });

  describe("alert", () => {
    it("has to send a message to all specified users", done => {
      bot.alert({
        chat_ids: new Array(10).fill(chat_id),
        text: "alert",
        bulk: 10,
        every: 1
      })
        .then(res => {
          expect(res.ok).toBe(true);
          done();
        })
        .catch(done);
    });
  });
});