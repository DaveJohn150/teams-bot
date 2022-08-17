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

      // //send to python service
      // let secretSpying = {text: removedMentionText, timestamp: context.activity.timestamp, userName: context.activity.from.name, 
      //   conversationType: context.activity.conversation.conversationType, conversationID: context.activity.conversation.id};
      // await axios.post('http://yomama:200', secretSpying, {'Content-Type':'application/json'})        


      // Trigger command by IM text
      switch (splitText[0]) {
        case "welcome": {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "cats": {
          await context.sendActivity(MessageFactory.carousel([rawCat1Card, rawCat2Card, rawCat3Card])) //content type not defined
          break;
        }
        case "ud": { //this doesnt fire, it gets recognised but doesnt execute its code
          if (splitText.length == 1) {
            context.sendActivity('ud command must include word to search. E.g. "ud updog"')
          }
          else {
            const card = await lookup(txt.substring(3)); //passes txt without "ud " - doesnt use aplitText[1] in case of multi word search e.g. "big dog"
            if (card.content){
              await context.sendActivity({attachments: [CardFactory.adaptiveCard(card.content)]});
            }
            else {
              await context.sendActivity(card)
            }
          }
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
         default:
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


    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      let memberNameObj = {memberName: ''}
      try {
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          let member = await TeamsInfo.getMember(context, membersAdded[cnt].id);
          if (member.givenName)
          {memberNameObj.memberName = member.givenName;}
          //render passes in an object of all dynamic variables within the card, they must be the same name as the ${varName} in the card
          const card = cardTools.AdaptiveCards.declare(rawWelcomeCard).render(memberNameObj);  
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
      }
      await next();
    }
    catch (err)
    {console.log(err)}
  });
      //membersAdded and membersRemoved do not have .name, only .id
    this.onMembersRemoved(async (context, next) => {
      // const membersRemoved = context.activity.membersRemoved;
      // for (let i = 0; i < membersRemoved.length; i++)
      // { 
      try {
        await context.sendActivity("Someone has been removed from the team.");
      }
      catch (err) {
        //if bot was removed will trigger the memberRemoved function
      }
      // }
      await next();
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    if (invokeValue.action.verb === "userlike") {
      this.likeCountObj.likeCount++;
      const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
    }
    else if (invokeValue.action.verb == "newSuggestion"){
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
      return { statusCode: 200 };
    }
  }

  // Message extension Code
  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    switch (action.commandId) { //find where the task module is invoked <= fill input field 
      case "shareMessage":
        return shareMessageCommand(context, action);
      case "urbanDefine":
        return lookupCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  async handleTeamsMessagingExtensionSelectItem(context, obj) {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.heroCard(obj.name, obj.description)],
      },
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

function shareMessageCommand(context, action) {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Message Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

async function lookupCommand(context, action) {
  let resultCard;
  if (typeof action.data.searchWord === "undefined"){
    return CardFactory.heroCard('An error occurred')
  }
  else
  {resultCard = await lookup(action.data.searchWord.trim())}
  if(typeof resultCard === 'string'){
    resultCard = CardFactory.heroCard(`There is no Urban Dictionary definition for ${action.data.searchWord}`)
  }
  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [resultCard]
    }
  }
}

async function lookup(word){

  //local env for api keys - not for deploy to azure
let urbanDictionaryAPIKey = process.env.URBAN_API; 

if (typeof urbanDictionaryAPIKey === "undefined"){
  console.error('No API key detected');
  exit();
}
else if (urbanDictionaryAPIKey.trim() == ''){
  console.error('No API key detected');
  exit();
}
String(word); 
  const options = {
  method: 'GET',
  url: 'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
  params: {term: word},
  headers: {
      'X-RapidAPI-Key': urbanDictionaryAPIKey,
      'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com'
  }
  };
  let card;
  await axios.request(options).then(response => {
          //console.log(response.data.list[0]);
      result = response.data.list[0];
      if (result != [] & typeof result !== "undefined"){
        var urbanDefinition = {
          word: result.word,
          definition: result.definition, 
          example: result.example,
          author: result.author,
          date: result.written_on.substring(0,10),
          likes: result.thumbs_up,
          dislikes: result.thumbs_down,
          viewUrl: result.permalink
        }        
        if(typeof urbanDefinition.definition === 'string'){
          urbanDefinition.definition = urbanDefinition.definition.replace(RegExp('\\[|\\]', 'g'), ''); //all hyperlinked words are nested into square brackets, removes them
        urbanDefinition.definition = urbanDefinition.definition.replace(RegExp('\r', 'g'), '\n'); //cards dont do anything with /r/n, only /n/n
        urbanDefinition.example = urbanDefinition.example.replace(RegExp('\\[|\\]', 'g'), '');
        urbanDefinition.example = urbanDefinition.example.replace(RegExp('\r', 'g'), '\n');
      }
        card = cardTools.AdaptiveCards.declare(rawDictCard).render(urbanDefinition);
       return card;
      }
      else{
       throw 'no def';
      }
  }).catch(error => {
      console.error(error);
      card = `There is no Urban Dictionary definition for ${word}`
      return card;
  });
  return card;
} 

module.exports.botActivityHandler = botActivityHandler;
