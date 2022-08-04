const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory, TeamsInfo } = require("botbuilder");


class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => { //this area only exists to actually check if bot is functional
      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }
            let reply = ''
            for (let i = 0; i < txt.length; i++)
            {
              if ((i/2) % 1 === 0) //even
              {
                reply += txt[i].toUpperCase();
              }
              else
              {
                reply += txt[i].toLowerCase();
              }
            }
          await context.sendActivity(reply);

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

}

module.exports.TeamsBot = TeamsBot; //must be same name as name in index.js
