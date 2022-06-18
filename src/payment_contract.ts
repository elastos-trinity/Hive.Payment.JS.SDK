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
        return this;
    }

    /**
     * Pay order on the smart contract for current wallet account.
     *
     * @param amount The amount of ELA to upgrade vault&backup
     * @param to The hive node wallet address.
     * @param memo The proof from place-order API of the hive node.
     * @return contract order id to settle-order API of the hive node.
     */
    payOrder(amount: string, to: string, memo: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            void (async () => {
                try {
                    const orderData = this.connector.getContract().methods.payOrder(to, memo).encodeABI();
                    let transactionParams = await this.createTxParams(orderData, amount, to);

                    LOG.info('after createTxParams: {}, {}', orderData, JSON.stringify(transactionParams));

                    await this.connector.getContract().methods.payOrder(to, memo).send(transactionParams)
                        .on('receipt', receipt => {
                            // contains event "OrderPay"
                            LOG.info('methods.payOrder.receipt: {}', JSON.stringify(receipt));
                            resolve(receipt.events.OrderPay.returnValues.orderId);
                        })
                        .on('error', (error, receipt) => {
                            LOG.info('methods.payOrder.error: {}, {}', JSON.stringify(error), JSON.stringify(receipt));
                            reject(error);
                        });
                } catch (error) {
                    reject(error);
                }
            })();
        });
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

        const txGas = await this.connector.getWeb3().eth.estimateGas(txData);
        LOG.info(`after this.web3.eth.estimateGas: ${JSON.stringify(txData)}`);
        const gasPrice = await this.connector.getWeb3().eth.getGasPrice();
        return  {
            from: accountAddress,
            gasPrice: gasPrice,
            gas: Math.round(txGas * 3),
            value: price_token,
        };
    }

    /**
     * Get all orders for current wallet account.
     */
    async getOrders() {
        const accountAddress = await this.connector.getAccountAddress();
        return await this.connector.getContract().methods.getOrders(accountAddress).call();
    }

    /**
     * Get specific order by index for current wallet account.
     */
    async getOrderByIndex(index: number) {
        const accountAddress = await this.connector.getAccountAddress();
        return await this.connector.getContract().methods.getOrderByAddress(accountAddress, index).call();
    }

    /**
     * Get the count of payment orders for current wallet account.
     */
    async getOrderCount() {
        const accountAddress = await this.connector.getAccountAddress();
        return await this.connector.getContract().methods.getOrderCountByAddress(accountAddress).call();
    }

    /**
     * Get order by order ID which belongs to any wallet account
     * @param orderId
     */
    async getOrder(orderId) {
        return await this.connector.getContract().methods.getOrder(orderId).call();
    }

    /**
     * Get platform address and fee.
     */
    async getPlatformFee() {
        return await this.connector.getContract().methods.getPlatformFee().call();
    }
}
