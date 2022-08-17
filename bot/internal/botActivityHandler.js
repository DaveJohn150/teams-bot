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
          await showSuggestions(context); //array of rendered cards sent by function   
          break;
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
    //create new sugggestion
    if (invokeValue.action.verb == "newSuggestion"){
      let allSuggestions = {}
      try {
        allSuggestions = JSON.parse(fs.readFileSync("./suggestion-box.json", {endcoding: "utf8",}))
      }
      catch (err) {
        console.error(err);
        return {statusCode: 500};
      }
      if(typeof allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`] !== "undefined"){   
        let exists = false; 
        for(let i =0; i < allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].length; i++){
          let suggestion = JSON.parse(allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`][i])
          if (suggestion.title.toLowerCase() == invokeValue.action.data.title.toLowerCase()) {
            exists = true;
            break;
          }
        }
          if (!exists) {
            allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].push(  
            JSON.stringify({title: invokeValue.action.data.title, desc: invokeValue.action.data.desc}));
          }
          else {
            await context.sendActivity("Suggestion already exists.")
          }
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

    //delete suggestion
    else if (invokeValue.action.verb == "deleteSuggestion"){ //if suggestion already deleted it will do nothing
      let allSuggestions = JSON.parse(fs.readFileSync("./suggestion-box.json", {endcoding: "utf8",}));
      for(let i =0; i < allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].length; i++){
        let suggestion = JSON.parse(allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`][i])
        if (suggestion.title == invokeValue.action.data.title){
          allSuggestions[`_${context.activity.conversation.tenantId}_${context.activity.conversation.id}`].splice(i, 1);
          break;
        }
      }
      try{
      fs.writeFileSync("./suggestion-box.json", JSON.stringify(allSuggestions));
      }
      catch (err) {
        console.log(err);
      }
      await showSuggestions(context);
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

async function showSuggestions(context) {
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
    if (cardList){
      for(let max8 = 0; max8 < cardList.length; max8 += 8){
        let subArray = cardList.slice(max8);
        if (subArray.length > 8){
          await context.sendActivity(MessageFactory.carousel(subArray.slice(0,8)))
        }
        else {
          await context.sendActivity(MessageFactory.carousel(subArray))
        }
      }
    }
    else {
      await context.sendActivity("No suggestions in suggestion box.")
    }
    return;
  }
  catch (err) {
    console.error(err);
    return;
  }
}

module.exports.botActivityHandler = botActivityHandler;
