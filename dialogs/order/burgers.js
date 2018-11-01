const { ComponentDialog, WaterfallDialog, ChoicePrompt } = require('botbuilder-dialogs');
const { userProfile } = require('../greeting/userProfile');
const { orderSummary } = require('./orderSummary');

const BURGER_ORDER_DIALOG = 'burgerOrderDialog';
const CHOICE_PROMPT = 'choisePrompt';
const burgerOrder = {
    mealBurger: undefined,
    mealFries: undefined,
    mealDrink: {}
};

class Burgers extends ComponentDialog {
    constructor(dialogueId) {
        super(dialogueId);
        if(!dialogID) throw ('Missed dialogId, it is required');

        this.addDialog(new WaterfallDialog(BURGER_ORDER_DIALOG, [
            this.promptChooseBurger.bind(this),
            this.promptChooseFries.bind(this),
            this.promptForDrink.bind(this),
            this.promptChooseDrink.bind(this),
            this.promptConfirmationOrder.bind(this),
            this.promptRestaurantChoice.bind(this),
            this.orderComplete.bind(this)
        ]))

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    }
    async promptChooseBurger(step) {
        const promptOptions = {
            prompt: 'Thank you for choosing Burger Meal menu! I have 3 options of burger:',
            reprompt: 'That was not valid choise, please select a what burger you like:',
            choises: ['Double-Double', 'Cheesburger', 'Hamburger']
        }
        return await step.prompt(CHOICE_PROMPT, promptOptions);
    }
    async promptChooseFries(step) {
        const burger = step.result;
        burgerOrder.mealBurger = burger.value;

        return await step.prompt(CHOICE_PROMPT, 'What fries you like to have? ', ['Regular fries', 'Animal style fries']);
    }
    async promptForDrink(step) {
        if(step.result) {
            burger.mealFries = step.result.value

            return await step.prompt(CHOICE_PROMPT, 'What beverage you want? I have an options:', ['Soda', 'Shake']);
        } else {
            burger.mealFries = 'Regular Fries'

            return await step.prompt(CHOICE_PROMPT, 'What beverage you want? I have an options:', ['Soda', 'Shake']);
        }
    }
    async promptChooseDrink(step) {
        if (step.result) {
            burgerOrder.mealDrink = {[step.result.value] : null };
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
            burgerOrder.mealDrink = { Soda : null };
            return await step.next()
        }
    }
    async promptConfirmationOrder(step) {
        if(burgerOrder.mealDrink.Soda === null) {
            burgerOrder.mealDrink.Soda = step.result.value
        } else {
            burgerOrder.mealDrink.Shake = step.result.value
        }
        const confirmationText = `Your order for burger meal: Burger - ${burgerOrder.mealBurger}, Fries - ${burgerOrder.mealFries}, Drink - ${burgerOrder.mealDrink.Soda ? burgerOrder.mealDrink.Soda : `Shake with flavor ${burgerOrder.mealDrink.Shake}`}. Is that correct?`
        return await step.prompt(CHOICE_PROMPT, confirmationText, ['yes', 'no'])
        // need to figure out how to get back on Main dialog
    }
    async promptRestaurantChoice(step) {
        if(step.result.value === 'yes') {
            const promptText = `${userProfile.name}, I found several restaurants on your zip code: ${userProfile.zip}, choose one for pick your order(enter number)`
            const restaurantOptions = ['111 Main St', '543 Smith Dr', '3535 Westfield Mall Dr']
            return await step.prompt(CHOICE_PROMPT, promptText, restaurantOptions);
        }
    }
    async orderComplete(step) {
        const address = step.result.value;
        const newOrder = new orderSummary(burgerOrder, null, address); // save new order

        await step.context.sendActivity(`Your order will be ready in 15 minutes. You can pick it in restaurant on address: ${newOrder.address}`);

        // end dialog and send order info
        return await step.endDialog(newOrder);
    }
}
exports.BurgerOrders = Burgers;