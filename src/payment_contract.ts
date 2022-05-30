import {WalletConnector} from "./wallet_connector";
import Web3 from "web3";
import BN from "bn.js";
import {Logger} from "./logger";

const LOG = new Logger("PaymentContract");


type TransactionData = {
    from: string;
    gasPrice: string;
    gas: number;
    value: any;
}


/**
 * Only for hive node payment service.
 *
 *      // mainnet
 *      const contract = await new PaymentContract().initialize();
 *
 *      // access API
 *      const newOrderId = contract.payOrder(2.5, dstWalletAddress, orderProof)
 *      const orders = contract.getOrders();
 *      const order = contract.getOrder(1023);
 *
 *      // testnet
 *      const contract = await new PaymentContract(true).initialize();
 *
 */
export class PaymentContract {
    private connector: WalletConnector;

    constructor(testnet = false) {
        this.connector = new WalletConnector(testnet);
    }

    async initialize(): Promise<PaymentContract> {
        await this.connector.initialize();

        this.connector.getContract().events.OrderPay(null,
            function(error, event){
                LOG.info('events.OrderPay: {}', event);
            })
            .on("connected", function(subscriptionId){
                // events.OrderPay.connected 0xbfd0d15d9085f0c5f4008f6d6b2d460d, sender account.
                LOG.info('events.OrderPay.connected: {}', subscriptionId);
            })
            .on('data', function(event){
                // same results as the optional callback above
                LOG.info('events.OrderPay.data: {}', event);
            })
            .on('changed', function(event){
                // remove event from local database
                LOG.info('events.OrderPay.changed: {}', event);
            })
            .on('error', function(error, receipt) {
                LOG.info('events.OrderPay.error: {}', error, receipt);
            });

        return this;
    }

    /**
     * Pay order on the smart contract.
     *
     * @param amount The amount of ELA to upgrade vault&backup
     * @param to The hive node wallet address.
     * @param memo The proof from place-order API of the hive node.
     * @return contract order id to settle-order API of the hive node.
     */
    async payOrder(amount: string, to: string, memo: string) {
        const orderData = this.connector.getContract().methods.payOrder(to, memo).encodeABI();
        let transactionParams = await this.createTxParams(orderData, amount, to);

        LOG.info('after createTxParams: %j, %j', orderData, transactionParams);

        // // Can not work with call() because of no transaction sending.
        // return await this.connector.getContract().methods.payOrder(to, memo).call(transactionParams);
        // contract.methods.payOrder(to, memo).call(transactionParams, function (error, result) {
        //     console.log(`payOrder error: ${error}, ${result}`);
        // });

        // OK with send()
        this.connector.getContract().methods
            .payOrder(to, memo)
            .send(transactionParams)
            .on('transactionHash', hash => {
                // transaction id
                LOG.info('methods.payOrder.transactionHash: {}', hash);
            })
            .on('receipt', receipt => {
                // contains sender wallet address.
                LOG.info('methods.payOrder.receipt: {}', receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                // confirmed by other accounts ???
                LOG.info('methods.payOrder.confirmation: {}, {}', confirmationNumber, receipt);
            })
            .on('error', (error, receipt) => {
                LOG.info('methods.payOrder.error: {}, {}', error, receipt);
            });
        return 0;
    }

    private async createTxParams(data: string, price: string, to: string): Promise<TransactionData> {
        const accountAddress = this.connector.getAccountAddress(); // sender wallet address
        const receiverAddress = this.connector.getReceiverAddress(); // contract address
        LOG.info(`from: ${accountAddress}, to: ${to}, through: ${receiverAddress}`);

        const price_token = new BN(Web3.utils.toWei(price, 'ether'));
        LOG.info(`price_token by 'ether', ${price_token}`);

        const txData = {
            from: accountAddress,
            to: receiverAddress,
            data: data,
            value: price_token,
        };

        try {
            const txGas = await this.connector.getWeb3().eth.estimateGas(txData);
            LOG.info(`after this.web3.eth.estimateGas: ${txData}`);
            const gasPrice = await this.connector.getWeb3().eth.getGasPrice();
            return  {
                from: accountAddress,
                gasPrice: gasPrice,
                gas: Math.round(txGas * 3),
                value: price_token,
            };
        } catch (error) {
            throw new Error(`failed to get gas price: ${error}`);
        }
    }

    /**
     * Pay order on the smart contract.
     */
    async getOrders() {
        const accountAddress = await this.connector.getAccountAddress();
        return await this.connector.getContract().methods.getOrders(accountAddress).call();
    }

    async getOrder(orderId) {
        return await this.connector.getContract().methods.getOrder(orderId).call();
    }
}
