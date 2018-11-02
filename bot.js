const {ActivityTypes} = require('botbuilder');
const {DialogSet, DialogTurnStatus} = require('botbuilder-dialogs');

// import dialogs
const { GreetingDialog } = require('./dialogs/greeting/index');
const { OrderDialog } = require('./dialogs/order/index');
const { UserProfile } = require('./dialogs/greeting/userProfile');
const { OrderSummary } = require('./dialogs/order/orderSummary');

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';
const ORDER_INFO_PROPERTY = 'orderInfoAccessor';

class MainBot {
    constructor(conversationState, userState, orderState) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');
        if (!orderState) throw new Error('Missing parameter.  orderState is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.orderState = orderState;

        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);
        this.orderInfoAccessor = orderState.createProperty(ORDER_INFO_PROPERTY);

        // adding main dialogs
        this.dialogs = new DialogSet(this.dialogStateAccessor)
            .add(new GreetingDialog('greetingDialog', this.userInfoAccessor))
            .add(new OrderDialog('orderDialog', this.userInfoAccessor, this.orderInfoAccessor));
    }

    async onTurn(turnContext) {

        if (turnContext.activity.type === ActivityTypes.Message) {

            const user = await this.userInfoAccessor.get(turnContext, {});
            const order = await this.orderInfoAccessor.get(turnContext, {});

            const dialogContext = await this.dialogs.createContext(turnContext);

            const dialogTurnResult = await dialogContext.continueDialog();

            if (dialogTurnResult.status === DialogTurnStatus.complete) {
                order = dialogTurnResult.result;
                await this.userInfoAccessor.set(turnContext, user);
                await this.orderInfoAccessor.set(turnContext, order)

                console.log(`Order: ${order}, Client: ${user}`);
                await dialogContext.cancelAllDialogs();

            } else if (!turnContext.responded) {
                if (!user) {
                    await dialogContext.beginDialog('greetingDialog');
                } else {
                    await dialogContext.beginDialog('orderDialog');
                }
            }
        // Save state changes
        await this.conversationState.saveChanges(turnContext);
        await this.userState.saveChanges(turnContext);
    }
}
}