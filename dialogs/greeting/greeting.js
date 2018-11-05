const { ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt } = require('botbuilder-dialogs');

const { UserProfile } = require('./userProfile');

// init variables
const SET_PROFILE_DIALOG = 'setProfileDialog';
const LANGUAGE_PROMPT = 'languagePrompt';
const NAME_PROMPT = 'namePrompt';
const ZIPCODE_PROMPT = 'zipCodePrompt';
const PHONE_PROMPT = 'phonePrompt';
//validators
const NAME_LENGTH_MIN = 3;
const ZIP_LENGTH = 5;
const PHONE_LENGTH = 10;
const VALIDATION_SUCCESS = true;
const VALIDATION_FAIL = !VALIDATION_SUCCESS;


class GreetingDialog extends ComponentDialog {
    constructor(dialogID, userInfoAccessor) {
        super(dialogID);

        // checking params
        if(!dialogID) throw ('Missed dialogId, it is required');
        if(!userInfoAccessor) throw ('Missed customerInfoAccessor parameter, it is required');

        this.addDialog(new WaterfallDialog(SET_PROFILE_DIALOG, [
            this.initState.bind(this),
            this.promptForLanguage.bind(this),
            this.promptForName.bind(this),
            this.promptForZipCode.bind(this),
            this.promptForPhone.bind(this),
            this.finalGreetingStep.bind(this),
            this.greetCustomer.bind(this)
        ]))

        this.addDialog(new ChoicePrompt(LANGUAGE_PROMPT));
        this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName));
        this.addDialog(new NumberPrompt(ZIPCODE_PROMPT, this.validateZip));
        this.addDialog(new NumberPrompt(PHONE_PROMPT, this.validatePhone));

        this.customerInfoAccessor = userInfoAccessor;

    }
    async initState(step) {
        let customerProfile = await this.customerInfoAccessor.get(step.context);
        if(customerProfile === undefined) {
            if(step.options && step.options.customerProfile) {
                await this.customerInfoAccessor.set(step.context, step.options.customerProfile)
            } else {
                await this.customerInfoAccessor.set(step.context, new UserProfile());
            }
        }
        return await step.next();
    }

    async promptForLanguage(step) {
        return await step.prompt(LANGUAGE_PROMPT, 'What language you like to use to make an order?', ['english', 'russian']);
    }

    async promptForName(step) {
        const customer = await this.customerInfoAccessor.get(step.context);

        if(customer !== undefined && customer.name !== undefined && customer.zip !== undefined && customer.phone !== undefined) {
            return await this.greetCustomer(step);
        }
        // store language choice
        if(step.result) {
            customer.language = step.result;
            await this.customerInfoAccessor.set(step.context, customer);
        }
        // set customer name
        if(!customer.name) {
            return await step.prompt(NAME_PROMPT, `Hi, my name is Bot. What is your name?`)
        } else {
            return await step.next();
        }
    }
    async promptForZipCode(step) {
        const customer = await this.customerInfoAccessor.get(step.context);
        if(customer.name === undefined && step.result) {
            let name = step.result
            customer.name = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
            await this.customerInfoAccessor.set(step.context, customer);
        }
        if(!customer.zip) {
            return await step.prompt(ZIPCODE_PROMPT, 'What is your location? Prease provide a ZIP Code(5 numbers only)');
        } else {
            return await step.next();
        }
    }
    async promptForPhone(step) {
        const customer = await this.customerInfoAccessor.get(step.context);
        // set zipcode (previous step)
        if(customer.zip === undefined && step.result) {
            customer.zip = parseInt(step.result);
            await this.customerInfoAccessor.set(step.context, customer)
        }
        if(!customer.phone) {
            return await step.prompt(PHONE_PROMPT, 'What is your phone number? (10 digits, include area code, just numbers)')
        } else {
            return await step.next();
        }
    }
    async finalGreetingStep(step) {
        const customer = await this.customerInfoAccessor.get(step.context);
        if(customer.phone === undefined && step.result) {
            let phone = step.result.toString();
            customer.phone = parseInt(phone.replace(/\D/g, ''));
            await this.customerInfoAccessor.set(step.context, customer);
        }
        return await this.greetCustomer(step);
    }
    // validations for checking name, zip and phone
    async validateName(validatorContext) {
        const name = (validatorContext.recognized.value || '').trim();
        if(name.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCESS;
        } else {
            await validatorContext.context.sendActivity(`Name should have contain at least ${NAME_LENGTH_MIN} characters long.`)
            return VALIDATION_FAIL;
        }
    }
    async validatePhone(validatorContext) {
        if (validatorContext.recognized.value && validatorContext.recognized.value.toString().length === PHONE_LENGTH) {
            return VALIDATION_SUCCESS;
        } else {
            await validatorContext.context.sendActivity(`Phone number should have ${PHONE_LENGTH} digit only, include area code.`)
            return VALIDATION_FAIL;
        }
    }
    async validateZip(validatorContext) {
        if(validatorContext.recognized.value && validatorContext.recognized.value.toString().length === ZIP_LENGTH) {
            return VALIDATION_SUCCESS;
        } else {
            await validatorContext.context.sendActivity(`ZIP Code should have ${ZIP_LENGTH} digits only.`);
            return VALIDATION_FAIL;
        }
    }
    // show greeting message
    async greetCustomer(step) {
        const customer = await this.customerInfoAccessor.get(step.context);
        await step.context.sendActivity(`Hi ${customer.name}, Welcome to In-n-Out Burger Bot system to make your order online easier and faster.`)
        return await step.endDialog({customer});
    }
}
exports.GreetingDialog = GreetingDialog;