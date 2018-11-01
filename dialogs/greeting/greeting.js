const { ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt } = require('botbuilder-dialogs');

const { userProfile } = require('./userProfile');

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


export default class GreetingDialog extends ComponentDialog {
    constructor(dialogID, userProfileAccessor) {
        super(dialogID);

        //checking params
        if(!dialogID) throw ('Missed dialogId, it is required');
        if(!userProfileAccessor) throw ('Missed userProfileAccessor parameter, it is required');

        this.addDialog(new WaterfallDialog(SET_PROFILE_DIALOG, [
            this.initState.bind(this),
            this.promptForLanguage.bind(this),
            this.promptForName.bind(this),
            this.promptForZipCode.bind(this),
            this.promptForPhone.bind(this),
            this.finalGreetingStep.bind(this)
        ]))

        this.addDialog(new ChoicePrompt(LANGUAGE_PROMPT));
        this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName));
        this.addDialog(new NumberPrompt(ZIPCODE_PROMPT, this.validateZip));
        this.addDialog(new NumberPrompt(PHONE_PROMPT, this.validatePhone));

        this.userProfileAccessor = userProfileAccessor;

    }
    async initState(step) {
        let userProfile = await this.userProfileAccessor.get(step.context);
        if(userProfile === undefined) {
            if(step.options && step.options.userProfile) {
                await this.userProfileAccessor.set(step.context, step.options.userProfile)
            } else {
                await this.userProfileAccessor.set(step.context, new UserProfile());
            }
        }
        return await step.next();
    }

    async promptForLanguage(step) {
        return await step.prompt(LANGUAGE_PROMPT, 'What language you like to use to make an order?', ['english', 'russian']);
    }

    async promptForName(step) {
        const user = await this.userProfileAccessor.get(step.context);

        if(user !== undefined && user.name !== undefined && user.zip !== undefined && user.phone !== undefined) {
            return await this.greetCustomer(step);
        }
        // store language choice
        if(step.result) {
            user.language = step.result;
            await this.userProfileAccessor.set(step.context, user);
        }
        // set user name
        if(!user.name) {
            return await step.prompt(NAME_PROMPT, 'I need your name to begin an order?')
        } else {
            return await step.next();
        }
    }
    async promptForZipCode(step) {
        const user = await this.userProfileAccessor.get(step.context);
        if(user.name === undefined && step.result) {
            let name = step.result
            user.name = name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
            await this.userProfileAccessor.set(step.context, user);
        }
        if(!user.zip) {
            return await step.prompt(ZIPCODE_PROMPT, 'What is your zip code(5 numbers only)?');
        } else {
            return await step.next();
        }
    }
    async promptForPhone(step) {
        const user = await this.userProfileAccessor.get(step.context);
        // set zipcode (previous step)
        if(user.zip === undefined && step.result) {
            user.zip = parseInt(step.result);
            await this.userProfileAccessor.set(step.context, user)
        }
        if(!user.phone) {
            return await step.prompt(PHONE_PROMPT, 'What is your phone number? (10 digits, include area code, just numbers)')
        } else {
            return await step.next();
        }
    }
    async finalGreetingStep(step) {
        const user = await this.userProfileAccessor.get(step.context);
        if(user.phone === undefined && step.result) {
            let phone = step.result;
            user.phone = parseInt(phone.replace(/\D/g, ''));
            await this.userProfileAccessor.set(step.context, user);
        }
        return await greetUser(step);
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
        if (validatorContext.recognized.value.toString().length === PHONE_LENGTH) {
            return VALIDATION_SUCCESS;
        } else {
            await validatorContext.context.sendActivity(`Phone number should have ${PHONE_LENGTH} digit only, include area code.`)
            return VALIDATION_FAIL;
        }
    }
    async validateZip(validatorContext) {
        if(validatorContext.recognized.value.toString().length === ZIP_LENGTH) {
            return VALIDATION_SUCCESS;
        } else {
            await validatorContext.context.sendActivity(`ZIP Code should have ${ZIP_LENGTH} digits only.`);
            return VALIDATION_FAIL;
        }
    }
    // show greeting message
    async greetUser(step) {
        const user = await this.userProfileAccessor.get(step.context);
        await step.context.sendActivity(`Hi ${user.name}, Welcome to In-n-Out Burger Bot system to make your order online easier and faster.`)
        return await step.endDialog();
    }
}
