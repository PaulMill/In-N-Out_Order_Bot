const path = require('path');

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const {BotConfiguration} = require('botframework-config'); // for configuration of bot

const express = require('express'); // for using express server of NodeJS

const { MainBot } = require('./bot');

// Initializing and configuring .env file
const ENV_FILE = path.join(__dirname, '.env');
const env = require('dotenv').config({path: ENV_FILE});


// bot configuration section
// Get the .bot file path
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

// For local development configuration as defined in .bot file
const DEV_ENVIRONMENT = 'development';

// Define name of the endpoint configuration section from the .bot file
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Get bot endpoint configuration by service name
// Bot configuration as defined in .bot file
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);



// bot adapter for connecting to MS Bot Service to send and receive messages
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword,
})

// Catch-all for errors.
adapter.onTurnError = async(context, error) => {
    // This check writes out errors to console log
    // NOTE: In production environment, you should consider logging this to Azure
    //    application insights.
    console.error(`\n [onTurnError]: ${error}`);
    // Send a message to the user
    context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await conversationState.clear(context);
    // Save state changes.
    await conversationState.saveChanges(context);
};

let conversationState, userState;
// Define State
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);


let bot = new MainBot(conversationState, userState);
// try {
//     bot = new MainBot(conversationState, userState, orderState);
// } catch (err) {
//     console.error(`[botInitializationError]: ${err}`);
//     process.exit();
// }

// HTTP Server
const appServer = express();
// assign port
const port = (process.env.port || process.env.PORT || 3978);
// run server
appServer.listen(port, () => {
    console.log(`\n${appServer.name} listening to port: ${port}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`)
})

// Listening for incoming messages on /api/messages
appServer.post('/api/messages', (req, res) => {
    // Using connector to process POST request into a TurnContext object
    adapter.processActivity(req, res, async(turnContext) => {
        await bot.onTurn(turnContext);
    })
})
