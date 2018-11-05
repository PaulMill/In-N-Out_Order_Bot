const { MessageFactory} = require('botbuilder')
const { DialogSet, Dialog, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');

const { BurgerOrders } = require('./burgers');
const { SaladOrders } = require('./salads');

// Dialogs ID
const BURGER_ORDER = 'burgerOrder';
const SALAD_ORDER = 'saladOrder';
// const SET_ORDER_DIALOG = 'setOrderDialog'

class OrderDialog extends ComponentDialog {
    constructor(dialogId, userInfoAccessor) {
        super(dialogId);

        this.initialDialogId = dialogId;

        // if(!dialogID) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed userInfoAccessor, it is required');
        this.userInfoAccessor = userInfoAccessor;
        this.dialogSet = dialogSet;


        this.dialogSet.add(new WaterfallDialog(dialogId, [
            this.promptForChoice.bind(this),
            this.startChildDialog.bind(this),
            this.saveResult.bind(this)
        ]));
        // this.dialogSet.add(new BurgerOrders(BURGER_ORDER, this.orderInfoAccessor, this.userInfoAccessor));
        // this.dialogSet.add(new SaladOrders(SALAD_ORDER, this.orderInfoAccessor, this.userInfoAccessor))
    }
    async promptForChoice(step) {
        const choices = ["Burger Meal", "Salad"];
        await step.context.sendActivity(MessageFactory.suggestedActions(choices, 'Great, What would you like to have today?'));
        return Dialog.EndOfTurn;
    }
    async startChildDialog(step) {
        const user = await this.userInfoAccessor.get(step.context)
        const order = await this.orderInfoAccessor.get(step.context);
        // check user input and flow to dialog
        switch (step.result) {
            case "Burger Meal":
                return await step.beginDialog(BURGER_ORDER, order, user);
                break;
            case "Salad":
                return await step.beginDialog(SALAD_ORDER, order, user);
                break;
            default:
                await step.context.sendActivity("Sorry, I don't understand that command. Please choose options from list.");
                return await step.replaceDialog(this.initialDialogId);
                break;
        }
    }
    async saveResult(step) {
        if(step.result) {
            const order = await this.orderInfoAccessor.get(step.context);
            return await step.endDialog(order);

        } else {
            return await step.replaceDialog(this.initialDialogId); // show menu again
        }
    }
}

exports.OrderDialog = OrderDialog;