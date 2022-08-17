const {teamsBot} = require('./teamsBot');

// Create bot.
const bot = new teamsBot({
  // The bot id and password to create BotFrameworkAdapter.
  // See https://aka.ms/about-bot-adapter to learn more about adapters.
  adapterConfig: {
    appId: process.env.BOT_ID,
    appPassword: process.env.BOT_PASSWORD,
  },
  // Enable notification
  notification: {
    enabled: true,
  },
});

module.exports = {
  bot,
};
