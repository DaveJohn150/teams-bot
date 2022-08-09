const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory, TeamsInfo, ActivityFactory } = require("botbuilder");
require('dotenv').config('./.env');
const fs = require('fs');

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
      switch (txt) {
        case "subscribe": {
            if (fs.existsSync('./subscribed.txt')) {
            let subscribed = fs.readFileSync('./subscribed.txt').toString();
            subscribed = subscribed.replace(/},/g, '}!!').split('!!');
            let newSub = JSON.stringify({conversationType: context.activity.conversation.conversationType, 
              conversationID: context.activity.conversation.id,
              tenant: context.activity.conversation.tenantId});
            if (!subscribed.includes(newSub)) { //not already in the subscription list
              subscribed.push(newSub);
               fs.writeFileSync('subscribed.txt', subscribed.toString());
               await context.sendActivity('You are now subscribed.')
            }
            else {
             await context.sendActivity('You are already subscribed.')
            }
          }
          else{
             fs.writeFileSync('./subscribed.txt', [JSON.stringify({conversationType: context.activity.conversation.conversationType, 
               conversationID: context.activity.conversation.id,
               tenant: context.activity.conversation.tenantId})].toString())
            await context.sendActivity('You are now subscribed.')
          }
          console.log('breaking')
          break;
        }
          // let subscribed = process.env.SUBSCRIBED_CHANNELS;
          // if (typeof subscribed !== 'undefined') {
          //   subscribed = subscribed.replace(/},/g, '}!!')
          //   let subList = subscribed.split('!!')
          //   let newSub = JSON.stringify({conversationType: context.activity.conversation.conversationType, 
          //     conversationID: context.activity.conversation.id,
          //     tenant: context.activity.conversation.tenantId});
          //   if (!subList.includes(newSub)) { //not already in the env list
          //     subList.push(newSub);
          //     process.env.SUBSCRIBED_CHANNELS = subList.toString();
          //     //send subscribed message
          //     break;
          //   }
          //   else {
          //   //send already subscribed message
          //   break;
          //   }
          // }
          // else {
          //   //adding into process env only retains data until bot restarts, need to add it into .env file or azure environment
          //   process.env.SUBSCRIBED_CHANNELS = [JSON.stringify({conversationType: context.activity.conversation.conversationType, 
          //     conversationID: context.activity.conversation.id,
          //     tenant: context.activity.conversation.tenantId})].toString();
          //     //send subscribed message
          //     break;
          // }
      default:
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
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

  async handleWebhook(req) {
    // const subscribed = process.env.SUBSCRIBED_CHANNELS;
    // if (subscribed) {
    //   subscribed.forEach(element => {
        
    //   });
    // }
    // else {
    //   process.env.SUBSCRIBED_CHANNELS = []
    //   console.log('no subscriptions')
    // }
  
    if (fs.existsSync('./subscribed.txt')){
      let subscribed = fs.readFileSync('./subscribed.txt').toString();
      subscribed = subscribed.replace(/},/g, '}!!').split('!!');
      for(const data of subscribed){
        let jsondata = JSON.parse(data);
        let context = new TurnContext();
        //scontext.activity = {conversation: {conversationType: jsondata.conversationType, id: jsondata.conversationID, tenantId: jsondata.tenant}};
        // context.activity.conversation.conversationType = jsondata.conversationType;
        // context.activity.conversation.id = jsondata.conversationID;
        // context.activity.conversation.tenantId = jsondata.tenant;

        await context.sendActivity('bazinga');
      };
    }
  }
}

module.exports.TeamsBot = TeamsBot; //must be same name as name in index.js
