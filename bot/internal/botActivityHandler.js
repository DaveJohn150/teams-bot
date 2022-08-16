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
const rawSuggestionCard = require("../adaptiveCards/suggestion.json");
const rawNewSuggestionCard = require("../adaptiveCards/newSuggestion.json");
const { fstat } = require("fs");
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
      console.log(invokeValue);
      let allSuggestions = {}
      fs.readFile("./suggestion-box.json", "utf8", (err, jsonstring) => {
        if (err) {
          console.error(err);
          return;
        }
        else {
          allSuggestions= JSON.parse(jsonstring);
        }
      })
      
      if(typeof allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`] !== "undefined"){
        allSuggestions[`_${context.activity.conversation.tenantId}_${context.actiivity.conversation.id}`].push(invokeValue.action.data.suggestion);
      }
      else {
        // allSuggestions.push( JSON.parse(`{"_${context.activity.conversation.tenantId}_${context.activity.conversation.id}": [${invokeValue.action.data.suggestion}]}`));
        let foo = 'cram';
        let bar = 'those';
        let tar = 'winz';
        allSuggestions.push( JSON.parse(`{ "${foo}_${bar}": ["${tar}"] }`));
      }
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

module.exports.botActivityHandler = botActivityHandler;
