const { bot } = require("./internal/initialize");
const restify = require("restify");
require('dotenv').config();



// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// HTTP trigger to send notification. You need to add authentication / authorization for this API. Refer https://aka.ms/teamsfx-notification for more details.
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


