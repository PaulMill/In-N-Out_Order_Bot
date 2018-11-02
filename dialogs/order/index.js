const { ActivityTypes, MessageFactory} = require('botbuilder')
const { DialogSet, Dialog, ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');

const { BurgerOrders } = require('./burgers');
const { SaladOrders } = require('./salads');
const { OrderSummary } = require('./orderSummary');

class OrderDialog extends ComponentDialog {
    constructor(dialogId, userInfoAccessor, orderInfoAccessor) {
        super(dialogId);
        if(!dialogID) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed userInfoAccessor, it is required');
        if(!orderInfoAccessor) throw ('Missed orderInfoAccessor, it is required');

        this.dialogs = new DialogSet(this.dialogStateAccessor)
            .add(new BurgerOrders('burgerOrders'))
            .add(new SaladOrders('saladOrders'))
            .add(new WaterfallDialog('orderDialog', [
                this.promptForChoice.bind(this),
                this.startChildDialog.bind(this),
                this.saveResult.bind(this)
            ]));
    }
    async promptForChoice(step) {
        const choices = ["Burger Meal", "Salad"];
        await step.context.sendActivity(MessageFactory.suggestedActions(choices, 'Great, What would you like to have today?'));
        return Dialog.EndOfTurn;
    }
    async startChildDialog(step) {
        const user = await this.userInfoAccessor.get(step.context)
        // check user input and flow to dialog
        switch (step.result) {
            case "Burger Meal":
                return await step.beginDialog('burgerOrders', user);
                break;
            case "Salad":
                return await step.beginDialog('saladOrders', user);
                break;
            default:
                await step.context.sendActivity("Sorry, I don't understand that command. Please choose options from list.");
                return await step.replaceDialog('orderDialog');
                break;
        }
    }
    async saveResult(step) {
        if(step.result) {
            const order = await this.orderInfoAccessor.get(step.context);
            await this.orderInfoAccessor.set(step.context, order)

        } else {
            return await step.replaceDialog('orderDialog'); // show menu again
        }
    }
}

exports.OrderDialog = OrderDialog;