const notificationTemplate = require("./adaptiveCards/notification-default.json");
const { bot } = require("./internal/initialize");
const { AdaptiveCards } = require("@microsoft/adaptivecards-tools");
const restify = require("restify");


// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// HTTP trigger to send notification. You need to add authentication / authorization for this API. Refer https://aka.ms/teamsfx-notification for more details.
server.post(
  "/api/notification",
  restify.plugins.queryParser(),
  restify.plugins.bodyParser(),
  async (req, res) => {
    try{
    if (!req.headers.apikey){
      throw 'Missing API header';
    }
    else if (req.headers.apikey != 'giggity'){ //make it check if the api key matches wherever they are stored
      throw 'Invalid API key';
    }
      //maybe check if they have a key n stuff that would be good stuff
    for (const target of await bot.notification.installations()) {
      console.log(req.body)
      message = req.body //azure receives them as actual JSON
      await target.sendAdaptiveCard(
        AdaptiveCards.declare(notificationTemplate).render({
          title: message.title,
          appName: message.appName,
          description: message.description
        })
      );
    }
  }
  catch (err){
    console.log(err)
    if (err == 'Missing API header'){
      res.json(400, {errorMessage: 'Missing apikey header'});
      return;
    }
    else if (err == 'Invalid API key'){
      res.json(401, {errorMessage: 'Invalid API key'});
      return;
    }
    else{
    res.json(400, {errorMessage:  
      'Requires JSON {title: "title of notification", appName: "name of origin app", description: "description of notification""}'});
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


