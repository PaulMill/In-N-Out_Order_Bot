const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { OrderSummary } = require('./orderSummary');

const SET_SALAD_ORDER = 'setSaladOrder';
const CHOICE_PROMPT = 'choisePrompt';


class Salads extends ComponentDialog {
    constructor(dialogId, userInfoAccessor) {
        super(dialogId);

        if(!dialogId) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed userInfoAccessor, it is required');
        this.customerInfoAccessor = userInfoAccessor;

        this.addDialog(new WaterfallDialog(SET_SALAD_ORDER, [
            this.initState.bind(this),
            this.promptChooseSalad.bind(this),
            this.promptForDrink.bind(this),
            this.promptChooseDrink.bind(this),
            this.promptConfirmationOrder.bind(this),
            this.promptRestaurantChoice.bind(this),
            this.orderComplete.bind(this)
        ]))

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

    }
    async initState(step) {
        let customer = await this.customerInfoAccessor.get(step.context);
        if(customer === undefined) {
            if(step.options && step.options.customerProfile) {
                let customerProfile = step.options.customerProfile;
                const orderSummary = new OrderSummary(null, null, null, customerProfile)
                await this.customerInfoAccessor.set(step.context, orderSummary)
            } else {
                await this.customerInfoAccessor.set(step.context, new OrderSummary());
            }
        } else {
            const orderSummary = new OrderSummary(null, null, null, customer)
            await this.customerInfoAccessor.set(step.context, orderSummary)
        }
        return await step.next();
    }
    async promptChooseSalad(step) {
        step.values.saladOrder = {};
        const promptOptions = {
            prompt: 'Thank you for choosing Salad menu! I have 2 options of our salads:',
            reprompt: 'That was not valid choise, please select a what salad you like:',
            choices: ['Greek', 'Cesar', 'Cobb']
        };
        return await step.prompt(CHOICE_PROMPT, promptOptions);
    }
    async promptForDrink(step) {
            step.values.saladOrder.SALAD = step.result;

            return await step.prompt(CHOICE_PROMPT, 'What drink you want? I have an options:', ['SODA', 'SHAKE']);
    }
    async promptChooseDrink(step) {
        if (step.result) {
            step.values.saladOrder.DRINK = {[step.result.value] : null };
            switch (step.result.value) {
                case 'SODA':
                    return await step.prompt(CHOICE_PROMPT, 'What kind of soda drink you like?', ['Coke', 'Sprite', 'DrPeper', 'Fanta']);
                    break;
                case 'SHAKE':
                    return await step.prompt(CHOICE_PROMPT, 'What flavor of shake you like?', ['Chocolate', 'Strawberry', 'Vanilla']);
                    break;
                default:
                    step.values.saladOrder = {...step.values.saladOrder, DRINK: { SODA : null }};
                    return await step.next();
                    break;
            }
        } else {
            step.values.saladOrder = {...step.values.saladOrder, DRINK: { SODA : null }};
            return await step.next()
        }
    }
    async promptConfirmationOrder(step) {
        let confirmationText = '';

        if(step.values.saladOrder.DRINK.SODA === null) {
            step.values.saladOrder.DRINK.SODA = step.result.value;

            confirmationText = `Your order summary is: Salad - ${step.values.saladOrder.SALAD.value}, Drink - ${step.values.saladOrder.DRINK.SODA}. Is that correct?`;
        } else {
            step.values.saladOrder.DRINK.SHAKE = step.result.value;

            confirmationText = `Your order summary is: Salad - ${step.values.saladOrder.SALAD.value}, Drink - Shake with flavor ${step.values.saladOrder.DRINK.SHAKE}. Is that correct?`;
        }

        return await step.prompt(CHOICE_PROMPT, confirmationText, ['yes', 'no']);
        // need to figure out how to get back on Main dialog
    }
    async promptRestaurantChoice(step) {
        const order = await this.customerInfoAccessor.get(step.context);

        if(step.result.value === 'yes') {
            const promptText = `${ order.customer.name }, I found several restaurants on your zip code: ${ order.customer.zip }, choose one for pick your order(enter number)`
            const restaurantOptions = ['111 Main St', '543 Smith Dr', '3535 Westfield Mall Dr']
            return await step.prompt(CHOICE_PROMPT, promptText, restaurantOptions);
        }
    }
    async orderComplete(step) {
        const orderSummary = await this.customerInfoAccessor.get(step.context)
        const newOrder = {...orderSummary, salad: step.values.saladOrder, location: step.result.value};

        await step.context.sendActivity(`Your order will be ready in 15 minutes. You can pick it in restaurant on address: ${newOrder.location}`);

        await this.customerInfoAccessor.set(step.context, newOrder)

        // end dialog and send order info
        return await step.endDialog(newOrder);
    }
}

exports.SaladOrders = Salads;