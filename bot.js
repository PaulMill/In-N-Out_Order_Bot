const {ActivityTypes} = require('botbuilder');
const { DialogTurnStatus} = require('botbuilder-dialogs');

// import dialogs
const { GreetingDialog } = require('./dialogs/greeting/index');
const { OrderDialog } = require('./dialogs/order/index');

// dialogs ID
const GREETING_DIALOG = 'greetingDialog';
const ORDER_DIALOG = 'orderDialog';

const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';
const ORDER_INFO_PROPERTY = 'orderInfoPropertyAccessor';

class MainBot {
    constructor(conversationState, userState) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');

        this.conversationState = conversationState;
        this.userState = userState;


        // this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        // adding main dialogs
        this.dialogSet.add(new OrderDialog(ORDER_DIALOG, this.userInfoAccessor, this.dialogSet));
        this.dialogSet.add(new GreetingDialog(GREETING_DIALOG, this.userInfoAccessor));

        this.onTurn.bind(this);
    }

    async onTurn(turnContext) {

        if (turnContext.activity.type === ActivityTypes.Message) {

            const user = await this.userInfoAccessor.get(turnContext, {});

            const dialogContext = await this.dialogSet.createContext(turnContext);

            const dialogTurnResult = await dialogContext.continueDialog();

            if (dialogTurnResult.status === DialogTurnStatus.complete) {
                await this.userInfoAccessor.set(turnContext, user);

                console.log(` Client: ${user}`);
                await dialogContext.cancelAllDialogs();

            } else if (!turnContext.responded) {
                console.log('User TurnON' + user)
                if (!user) {
                    await dialogContext.beginDialog(GREETING_DIALOG, this.userInfoAccessor);
                } else {
                    await dialogContext.beginDialog(ORDER_DIALOG, this.userInfoAccessor);
                }
            }
        }
        // Save state changes
        await this.conversationState.saveChanges(turnContext);
        await this.userState.saveChanges(turnContext);
    }
}
exports.MainBot = MainBot;