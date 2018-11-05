const { MessageFactory} = require('botbuilder')
const { Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');

const { BurgerOrders } = require('./burgers');
const { SaladOrders } = require('./salads');

// Dialogs ID
const BURGER_ORDER = 'burgerOrder';
const SALAD_ORDER = 'saladOrder';
const SET_ORDER_DIALOG = 'setOrderDialog'

class OrderDialog extends ComponentDialog {
    constructor(dialogId, userInfoAccessor) {
        super(dialogId);

        if(!dialogId) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed customerInfoAccessor, it is required');

        this.customerInfoAccessor = userInfoAccessor;

        this.addDialog(new WaterfallDialog(SET_ORDER_DIALOG, [
            this.promptForChoice.bind(this),
            this.startChildDialog.bind(this),
            this.saveResult.bind(this)
        ]));
        this.addDialog(new SaladOrders(SALAD_ORDER, this.customerInfoAccessor))
        this.addDialog(new BurgerOrders(BURGER_ORDER, this.customerInfoAccessor));
    }
    async promptForChoice(step) {
        const choices = ["Burger Meal", "Salad"];
        await step.context.sendActivity(MessageFactory.suggestedActions(choices, 'What would you like to have today?'));
        return Dialog.EndOfTurn;
    }
    async startChildDialog(step) {
        const customerInfoAccessor = await this.customerInfoAccessor.get(step.context)
        // check user input and flow to dialog
        switch (step.result) {
            case "Burger Meal":
                return await step.beginDialog(BURGER_ORDER);
                break;
            case "Salad":
                return await step.beginDialog(SALAD_ORDER);
                break;
            default:
                await step.context.sendActivity("Sorry, I don't understand that command. Please choose options from list.");
                return await step.replaceDialog(SET_ORDER_DIALOG);
                break;
        }
    }
    async saveResult(step) {
        if(step.result) {
            const user = await this.customerInfoAccessor.get(step.context);
            console.log('saveResult: ' + JSON.stringify(user));
            return await step.endDialog(user);

        } else {
            const user = await this.customerInfoAccessor.get(step.context);
            return await step.replaceDialog(SET_ORDER_DIALOG); // show menu again
        }
    }
}

exports.OrderDialog = OrderDialog;