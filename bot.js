const {ActivityTypes} = require('botbuilder');
const { DialogSet, WaterfallDialog, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');

// import dialogs
const { GreetingDialog } = require('./dialogs/greeting/index');
const { OrderDialog } = require('./dialogs/order/index');

// dialogs ID
const GREETING_DIALOG = 'greetingDialog';
const ORDER_DIALOG = 'orderDialog';

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';

class MainBot {
    constructor(conversationState, userState) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');

        this.conversationState = conversationState;
        this.userState = userState;


        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        // adding main dialogs
        this.dialogs = new DialogSet(this.dialogStateAccessor);
        this.dialogs.add(new OrderDialog(ORDER_DIALOG, this.userInfoAccessor));
        this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userInfoAccessor));

    }

    async onTurn(turnContext) {

        if (turnContext.activity.type === ActivityTypes.Message) {

            const user = await this.userInfoAccessor.get(turnContext, {});

            const dialogContext = await this.dialogs.createContext(turnContext);

            const dialogTurnResult = await dialogContext.continueDialog();

            if (dialogTurnResult.status === DialogTurnStatus.complete) {
                await this.userInfoAccessor.set(turnContext, user);

                await dialogContext.beginDialog(ORDER_DIALOG);

            } else if (!turnContext.responded) {
                if (!user.customerInfo) {
                    await dialogContext.beginDialog(GREETING_DIALOG);
                } else {
                    await dialogContext.beginDialog(ORDER_DIALOG);
                }
            }
        }
        // Save state changes
        await this.conversationState.saveChanges(turnContext);
        await this.userState.saveChanges(turnContext);
    }
}
exports.MainBot = MainBot;