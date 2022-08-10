const axios = require("axios");
const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory, TeamsInfo, ActivityFactory } = require("botbuilder");
require('dotenv').config('./.env');


class botActivityHandler extends TeamsActivityHandler { 
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };


    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      let splitText = []
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
        splitText = txt.split(' ')
      }

      // Trigger command by IM text
      switch (splitText[0]) {
        case "welcome": {
 
        }
        /**
         * case "yourCommand": {
         *   await context.sendActivity(`Add your response here!`);
         *   break;
         * }
         */
         default:
          {
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
          //await context.sendActivity(context.activity.from.name);
          }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

  };
}



module.exports.botActivityHandler = botActivityHandler;
