const { ConversationBot } = require("@microsoft/teamsfx");
const { botActivityHandler } = require("./botActivityHandler");

class teamsBot extends ConversationBot {
    constructor(options){
        super(options);
        this.activityHandler = new botActivityHandler();


    }
}

module.exports.teamsBot = teamsBot;