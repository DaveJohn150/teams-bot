const axios = require("axios");
const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory, TeamsInfo, ActivityFactory } = require("botbuilder");
require('dotenv').config();
const cardTools = require("@microsoft/adaptivecards-tools");
const { exit } = require("process");
const fs = require('fs');

//import card templates
const rawWelcomeCard = require("../adaptiveCards/welcome.json");
const rawLearnCard = require("../adaptiveCards/learn.json");
const rawCat1Card = require("../adaptiveCards/cat1.json");
const rawCat2Card = require("../adaptiveCards/cat2.json");
const rawCat3Card = require("../adaptiveCards/cat3.json");
const rawDictCard = require("../adaptiveCards/urbanDict.json");
const rawNewSuggestionCard = require("../adaptiveCards/newSuggestion.json");

class botActivityHandler extends TeamsActivityHandler { 
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };


    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      if (typeof txt === 'undefined'){
        await next();
        return;
      }
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
          break;
        }
        case "createsuggestion": {
          const card = cardTools.AdaptiveCards.declare(rawNewSuggestionCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });        
          break;
        }
        case "showsuggestions": {
          const cards = showSuggestions(context); //array of rendered cards sent by function
          if (typeof cards !== "undefined") {
            let cat = rawCat1Card
            await context.sendActivity(MessageFactory.carousel(cards))
            break;
          }        
        }
        /**
         * case "yourCommand": {
         *   await context.sendActivity(`Add your response here!`);
         *   break;
         * }
         */
         default: //only kept to assure bot works
          {
            let reply = ''
            for (let i = 0; i < txt.length; i++)
            {
              if ((i/2) % 1 === 0) //even
              {
                reply += txt[i].toLowerCase();
              }
              else
              {
                reply += txt[i].toUpperCase();
              }
            }
          await context.sendActivity(reply);
          //await context.sendActivity(context.activity.from.name);
          }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    if (invokeValue.action.verb == "newSuggestion"){
      //console.log(invokeValue);
      let allSuggestions = {}
      try {
        allSuggestions = JSON.parse(fs.readFileSync("./suggestion-box.json", {endcoding: "utf8",}))
      }
      catch (err) {
        console.error(err);
        return {statusCode: 500};
      }
      if(typeof allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`] !== "undefined"){     
          allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].push(
            JSON.stringify({title: invokeValue.action.data.title, desc: invokeValue.action.data.desc}));
      }
      else {
        allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`] = [
          JSON.stringify({title: invokeValue.action.data.title, desc: invokeValue.action.data.desc})];
      }
      fs.writeFile("./suggestion-box.json", JSON.stringify(allSuggestions), (err) => {
        if (err){
          console.error(err);
        }
      });
      return { statusCode: 200 };
    }
    else if (invokeValue.action.verb == "deleteSuggestion"){
      //delete from suggestion box
      return {statusCode: 200}
    }
    else{
      return {statusCode: 500}
    }
  }

  // Message extension Code
  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    
  }

  async handleTeamsMessagingExtensionSelectItem(context, obj) {
    return {
      
    };
  }
}

function showSuggestions(context) {
  try {
    const allSuggestions = JSON.parse(fs.readFileSync("./suggestion-box.json", {endcoding: "utf8",}))
    let cardList = []
    for(let i =0; i < allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].length; i++){
      let suggestion = JSON.parse(allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`][i])
      cardList.push(
        CardFactory.adaptiveCard( //cannot list cards that were predefined and rendered using dynamic placeholders AFAIK ~ doing this way gives it "content" and "content-type"
          {
            "type": "AdaptiveCard",
            "body": [
              {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "Bolder",
                "text": `${suggestion.title}`
              },
              {
                "type": "TextBlock",
                "text": `${suggestion.desc}`,
                "wrap": true
              }
            ],
            "actions": [
              {
                "type": "Action.ShowCard",
                "title": "Delete suggestion",
                "card":{
                    "body": [
                    {
                        "type": "TextBlock",
                        "size": "Medium",
                        "weight": "Bolder",
                        "text": "Confirm?"
                    }
                    ],
                "actions": [
                    {
                        "type": "Action.Execute",
                        "title": "Confirm",
                        "verb": "deleteSuggestion",
                        "data": {"title": `${suggestion.title}`}
                    }
                ]
                }
              }
            ],
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.4"
          }
        )
      )
    }
    return cardList;
  }
  catch (err) {
    console.error(err);
    return;
  }
}

module.exports.botActivityHandler = botActivityHandler;
