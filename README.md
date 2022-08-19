# Microsoft Teams bot

## Resources used
### Microsoft Teams toolkit
A VScode extension that utilises the Microsoft bot framework to develop Microsoft Teams apps. The toolkit offers templates and a code skeleton for different kinds of apps.
The Teams Toolkit for Visual Studio Code helps developers create and deploy Teams apps with integrated identity, access to cloud storage, data from Microsoft Graph, and other services in Azure and Microsoft 365 with a “zero-configuration” approach to the developer experience.
Teams toolkit was selected to create this project as it includes the core tools needed to run and debug a Teams bot through visual studio code with minimal effort required to install.
https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/visual-studio-code-overview

### Microsoft 365 Developer Sandbox
Creates a fake administrator account with its own company and staff for testing Microsoft apps. Used for a sandbox Teams environment for testing the Teams bot.
This was used for an environment to test the bot.
[Developer Program | Microsoft 365 Dev Center](https://developer.microsoft.com/en-us/microsoft-365/dev-program)

### Adaptive card designer
A web based graphical designer for creating Microsoft’s adaptive cards and generating the JSON structure for them. 
https://adaptivecards.io/designer/

### Adaptive Cards studio
A VScode extension for designing and viewing adaptive cards. 
https://marketplace.visualstudio.com/items?itemName=madewithcardsio.adaptivecardsstudiobeta

### Additional resources
Microsoft Teams app tutorials: [Hello World with JavaScript - Teams | Microsoft Docs](https://docs.microsoft.com/en-us/microsoftteams/platform/sbs-gs-bot?tabs=vscode%2Cviscode)
Teams app sample repository: [Microsoft-Teams-Samples/samples at main · OfficeDev/Microsoft-Teams-Samples (github.com)](https://github.com/OfficeDev/Microsoft-Teams-Samples/tree/main/samples)
Urban dictionary API - used to demonstrate the bot can access an external API: https://rapidapi.com/community/api/urban-dictionary

## Main files:
### /templates/appPackage/manifest.template.json 
Outlines the manifests of the dev and local manifests generated when ran/deployed. Defines the scope of the bot (personal, groupchat, team) and permissions of the bot
“commandlists” defines the commands that will appear within the command palette in the search bar. Each command must have a title and description.
“composeExtensions” defines the message extensions that the bot offers, where they can be invoked from and the task module associated with the extension.

### /bot/internal/botActivityHandler.js
Defines the internal functionality of the bot. Overrides default handler functions from the TeamsActivityHandler class.
The **onMessage** triggers whenever the bot is messaged or @mentioned within Teams. The switch-case statement handles any of the chat commands by reading the message. If no commands are detected through the cases, the default case will execute – in this bot it replies with the same message from the user but in a mOcKiNg cAsE.
The **onMembersAdded** handler triggers when a user is added to the group chat or team. The context supplied to the handler includes the id of the member added, but not the name. The name is retrieved through TeamsInfo.getmember().
The **onMembersRemoved** handler triggers when a user is removed from the group chat or team. Like with onMembersAdded, the context supplies the id of the member removed, however, TeamsInfo.getMember() cannot retrieve their name as the member is no longer in the team.
The **onAdaptiveCardInvoke** handler is called when an adaptive card has a button that triggers functionality within the bot. The learn card contains a like button which increments a counter on the card. This is done by calling the adaptive card invoke handler and reloading the card with the new counter value.
The **handleTeamsMessagingExtensionSubmitAction** handler is called when the task module created from a message extension is submitted. The commandID from the message extension is used to determine which function is called.
**handleTeamsMessagingExtensionSelectItem** enables the messaging extensions to show as a list and be selected.
<img width="442" alt="image" src="https://user-images.githubusercontent.com/89892673/185564278-72528f90-e0c3-4c89-88d9-fb17fdef62e3.png"><img width="486" alt="Drawing1" src="https://user-images.githubusercontent.com/89892673/185566414-0c64a3ca-e1c8-4c59-9776-1bd7f68b3965.png">

### /bot/adaptivecards
Contatains all the adaptive card templates for the bot to send to users 

### /bot/internal/teamsBot.js
Creates a class extending the ConversationBot class containinig the botActivityHandler for activity functionality.

### /bot/internal/initialize.js
Creates and initialises the bot from the classes

### /bot/index.js
Creates the REST API servers and listens for activity. When activity happens on the REST server, will invoke the bot to handle the activity. Any messages sent through teams are sent to /api/messages and for any notification activity from external applications, /api/notification has been designated.

## Publishing the Teams bot
Once the bot has been provisioned and deployed to Azure through Teams toolkit, the app can either be published to the organisation or the Teams store. To publish to your organisation enter the Teams admin center: Manage apps - Microsoft Teams admin center and click on Team apps > Manage apps. 

 ![image](https://user-images.githubusercontent.com/89892673/185564463-f6e7371a-d560-4ad3-be40-2afe0d1698c0.png)
  
Clicking the upload a new app button within the Manage apps tab will open a modal to upload a zip file to. 
The zip files to upload are created when provisioning the bot for deployment, the can be found in “<bot_name>/build/appPackage”. There will be two zip files, the local and the dev packages. The dev package contains the dev manifest, filled with the ids and endpoints from the bot in the Azure server, whereas the local appPackage contains the local ids of the bot.
Upload the dev package to the admin center to be able to install the app within any Team in that organisation.

The local appPackage zip being built seems to indicate that you could host the bot on a local server. Might be worth looking into that?
