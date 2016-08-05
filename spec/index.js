const Bot = require("../index.js");

describe("Bot", () => {
  describe("sendMessage", () => {
    const bot = new Bot("192333480:AAERHDlglKDEuxXqj97i_uO-gEwi08H-jn8");
    
    it("should send a message", done => {
      bot.sendMessage({
        text: "a message from test",
        chat_id: 1501719
      })
      .then(res => {
        expect(res.ok).toBe(true);
        done();
      });
    });
  });
});