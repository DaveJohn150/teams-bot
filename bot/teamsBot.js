const axios = require("axios");
const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory, TeamsInfo } = require("botbuilder");
const cardTools = require("@microsoft/adaptivecards-tools");
const { exit } = require("process");
require('dotenv').config();

//import card templates
const rawDictCard = require("./adaptiveCards/urbanDict.json");

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      let txt = context.activity.text;
      let splitText = []
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
        splitText = txt.split(' ')
      }

      // Trigger command by IM text
      if(splitText[0]){
      switch (splitText[0]) {
        case "ud": { 
          if (splitText.length == 1) {
            context.sendActivity('ud command must include word to search. E.g. "ud updog"')
          }
          else {
            const card = await lookup(txt.substring(3)); //passes txt without "ud " - doesnt use aplitText[1] in case of multi word search e.g. "big dog"
            await context.sendActivity({attachments: [CardFactory.adaptiveCard(card.content)]});
          }
          break;
        }       
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
          }
        }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

  // Message extension Code
  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    switch (action.commandId) { //find where the task module is invoked <= fill input field 
      case "urbanDefine":
        return lookupCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }
}

async function lookupCommand(context, action) {
  let resultCard;
  if (typeof action.data.searchWord !== "undefined"){
    resultCard = await lookup(action.data.searchWord.trim());
  }
  else
  { return;}
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

if (typeof urbanDictionaryAPIKey === "undefined" | urbanDictionaryAPIKey.trim() == ''){
  console.error('No API key detected');
  await exit();
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
        let urbanDefinition = {
          word: result.word,
          definition: result.definition,
          example: result.example,
          author: result.author,
          date: result.written_on.substring(0,10), //need to use Date() function to make it readable format
          likes: result.thumbs_up,
          dislikes: result.thumbs_down,
          viewUrl: result.permalink
        }
        urbanDefinition.definition = urbanDefinition.definition.replaceAll(RegExp('\\[|\\]', 'g'), ''); //all hyperlinked words are nested into square brackets, removes them
        urbanDefinition.definition = urbanDefinition.definition.replaceAll(RegExp('\r', 'g'), '\n'); //cards dont do anything with /r/n, only /n/n
        urbanDefinition.example = urbanDefinition.example.replace(RegExp('\\[|\\]', 'g'), '');
        urbanDefinition.example = urbanDefinition.example.replace(RegExp('\r', 'g'), '\n');
        card = cardTools.AdaptiveCards.declare(rawDictCard).render(urbanDefinition);
        return card;
      }
      else{
        card = CardFactory.heroCard(
          `There is no Urban Dictionary definition for ${action.data.searchWord}`
        );
        return card;
      }
  }).catch(error => {
      console.error(error);
      return;
  });
  return card;
}

module.exports.TeamsBot = TeamsBot;
