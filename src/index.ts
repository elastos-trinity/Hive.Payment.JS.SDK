import { PaymentContract } from "./payment_contract";
import { WalletConnector } from "./wallet_connector";
import {Logger} from "./logger";

Logger.setDefaultLevel(Logger.DEBUG);

export {
    PaymentContract,
    WalletConnector,
}