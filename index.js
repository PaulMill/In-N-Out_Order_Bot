const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const express = require('express');

const { MainBot } = require('./bot');

// Define State
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const orderState = new UserState(memoryStorage);


// bot connector for connecting to MS Bot Service to send and receive messages
const connector = new BotFrameworkAdapter({
    appId: process.env.botAppId,
    appPassword:process.env.botAppPassword
})

// Catch-all for errors.
connector.onTurnError = async(context, error) => {
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

let bot;
try {
    bot = new MainBot(conversationState, userState, orderState);
} catch (err) {
    console.error(`[botInitializationError]: ${err}`);
    process.exit();
}

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
    connector.processActivity(req, res, async(turnContext) => {
        await bot.onTurn(turnContext);
    })
})
