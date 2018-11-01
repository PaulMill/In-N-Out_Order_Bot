const botbulder = require('botbuilder');
const express = require('express');

// bot connector for connecting to MS Bot Service to send and receive messages
const connector = new botbulder.BotFrameworkAdapter({
    appId: process.env.botAppId,
    appPassword:process.env.botAppPassword
})

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
        if(turnContext._activity.type === 'message') {
            const inputText = turnContext._activity.text; // received input from user

            await turnContext.sendActivity(`You said '${inputText}' is that correct?`); // show text to user
        }
    })
})
