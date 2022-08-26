const notificationTemplate = require("./adaptiveCards/notification-default.json");
const notificationWithImage = require("./adaptiveCards/notificationWithAvatar.json");
const { bot } = require("./internal/initialize");
const { AdaptiveCards } = require("@microsoft/adaptivecards-tools");
const restify = require("restify");
require('dotenv').config();



// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// HTTP trigger to send notification. You need to add authentication / authorization for this API. Refer https://aka.ms/teamsfx-notification for more details.
server.post(
  "/api/alert",
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(),
  async (req, res) => {
    try{console.log(req.body)}
    catch (err){console.log(err)}
    try{
    if (!req.headers.authorization){
      throw 'Missing auth header';
    }
    else if (req.headers.authorization != process.env.BOTAUTH){ 
      throw 'Invalid API key';
    }
    for (const target of await bot.notification.installations()) {
      message = req.body
      if (typeof message.avatar_url !== 'undefined')
      {
        await target.sendAdaptiveCard(
          AdaptiveCards.declare(notificationWithImage).render({
            title: message.title,
            appName: message.appName,
            description: message.content,
            avatar_url: message.avatar_url
          })
        );
      }
      else 
      {await target.sendAdaptiveCard(
        AdaptiveCards.declare(notificationTemplate).render({
          title: message.title,
          appName: message.appName,
          description: message.content
        })
      );}
    }
  }
  catch (err){
    console.log(err)
    if (err == 'Missing auth header'){
      res.json(400, {errorMessage: 'Missing authorization header'});
      return;
    }
    else if (err == 'Invalid API key'){
      res.json(401, {errorMessage: 'Invalid API authorization key'});
      return;
    }
    else{
    res.json(400, {errorMessage:  
      'Requires JSON {title: "title of notification", appName: "name of origin app", content: "description of notification""}'});
      return;
    }
  }
    res.json(200, {});
  }
);

// Message handler.
server.post("/api/messages", async (req, res) => {
  try{
  await bot.requestHandler(req, res, async (context) => {
          await bot.activityHandler.run(context);
       });
  // await bot.adapter.processActivity(req, res, async (context) => {
  //   await bot.activityHandler.run(context) does the same thing
  // })
      }
      catch{
        //if a post occurs to the api/messages that isnt a proper teams message itll throw errors
      }
});


