const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { orderSummary } = require('./orderSummary');

const SALAD_ORDER_DIALOG = 'saladOrderDialog';
const CHOICE_PROMPT = 'choisePrompt';
const saladOrder = {
    SALAD: undefined,
    DRINK: {}
};

class Salads extends ComponentDialog {
    constructor(dialogueId, orderInfoAccessor, userInfoAccessor) {
        super(dialogueId);

        if(!dialogID) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed userInfoAccessor, it is required');
        if(!orderInfoAccessor) throw ('Missed orderInfoAccessor, it is required');

        this.addDialog(new WaterfallDialog(SALAD_ORDER_DIALOG, [
            this.initState.bind(this),
            this.promptChooseSalad.bind(this),
            this.promptForDrink.bind(this),
            this.promptConfirmationOrder.bind(this),
            this.promptRestaurantChoice.bind(this),
            this.orderComplete.bind(this)
        ]))

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.userInfoAccessor = userProfileAccessor;
        this.orderInfoAccessor = orderInfoAccessor;
    }
    async initState(step) {
        let userProfile = await this.userInfoAccessor.get(step.context);
        let orderInfo = await this.orderInfoAccessor.get(step.context);

        if(userProfile === undefined) {
            if(step.options && step.options.userProfile) {
                await this.userInfoAccessor.set(step.context, step.options.userProfile)
            } else {
                await this.userInfoAccessor.set(step.context, new UserProfile());
            }
        }
        if(orderInfo === undefined) {
            if(step.options && step.options.orderSummary) {
                await this.orderInfoAccessor.set(step.context, step.options.orderSummary)
            } else {
                await this.orderInfoAccessor.set(step.context, new OrderSummary());
            }
        }
        return await step.next();
    }
    async promptChooseSalad(step) {
        const promptOptions = {
            prompt: 'Thank you for choosing Salad menu! I have 2 options of our salads:',
            reprompt: 'That was not valid choise, please select a what salad you like:',
            choises: ['Greek', 'Cesar', 'Cobb']
        }
        return await step.prompt(CHOICE_PROMPT, promptOptions);
    }
    async confirmDrink(step) {
        const salad = step.result;
        saladOrder.SALAD = salad.value;

        return await step.prompt(CHOICE_PROMPT, 'Would youlike to add a drink you your order?', ['yes', 'no'])
    }
    async promptForDrink(step) {
        if(step.result && step.result.value === 'yes') {
            async (step) => {
                return await step.prompt(CHOICE_PROMPT, 'What beverage you want? I have 2 options:', ['Soda', 'Shake']);
            }
            async (step) => {
                if (step.result) {
                    saladOrder.DRINK = {[step.result.value] : null };
                    switch (step.result.value) {
                        case 'Soda':
                            return await step.prompt(CHOICE_PROMPT, 'What kind of soda drink you like?', ['Coke', 'Sprite', 'DrPeper', 'Fanta']);
                            break;
                        case 'Shake':
                            return await step.prompt(CHOICE_PROMPT, 'What flavor of shake you like?', ['Chocolate', 'Strawberry', 'Vanilla']);
                            break;
                        default: return await step.next();
                            break;
                    }
                } else {
                    saladOrder.DRINK = { Soda : null };
                    return await step.next()
                }
            }
        } else {
            return await step.next(-1);
        }

    }
    async promptConfirmationOrder(step) {
        let confirmationText = '';

        if(saladOrder.DRINK.Soda === null) {
            saladOrder.DRINK.Soda = step.result.value;

            confirmationText = `Your order summary is: Salad - ${saladOrder.salad}, Drink - ${saladOrder.DRINK.Soda}. Is that correct?`;
        } else {
            saladOrder.DRINK.Shake = step.result.value;

            confirmationText = `Your order summary is: Salad - ${saladOrder.salad}, Drink - Shake with flavor ${saladOrder.DRINK.Shake}. Is that correct?`;
        }

        return await step.prompt(CHOICE_PROMPT, confirmationText, ['yes', 'no']);
        // need to figure out how to get back on Main dialog
    }
    async promptRestaurantChoice(step) {
        const userProfile = await this.userInfoAccessor(step.context);

        if(step.result.value === 'yes') {
            const promptText = `${userProfile.name}, I found several restaurants on your zip code: ${userProfile.zip}, choose one for pick your order(enter number)`
            const restaurantOptions = ['111 Main St', '543 Smith Dr', '3535 Westfield Mall Dr']
            return await step.prompt(CHOICE_PROMPT, promptText, restaurantOptions);
        }
    }
    async orderComplete(step) {
        const address = step.result.value;
        const newOrder = new orderSummary(null, saladOrder, address);
        await step.context.sendActivity(`Your order will be ready in 15 minutes. You can pick it in restaurant on address: ${newOrder.address}`);

        await this.orderInfoAccessor.set(step.context, newOrder); // save new order

        // end dialog and send order info
        return await step.endDialog();
    }
}

exports.SaladOrders = Salads;