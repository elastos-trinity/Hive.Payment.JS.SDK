import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import {log} from "npmlog";
import {Config} from "./config";
import paymentAbi from './order_abi.json';

const TAG = 'WalletConnector';


/**
 * Wallet Connector
 *
 * Usage examples:
 *
 *      const connector = await new WalletConnector().initialize();
 *
 *      // Normal access with web3: Get Accounts
 *      const accounts = await connector.getWeb3().eth.getAccounts();
 *
 */
export class WalletConnector {
    // for WalletConnectProvider
    private rpc: { [chainId: number]: string } = Config.CONTRACT_RPC;
    private bridge: string = Config.BRIDGE;
    // for Contract
    private paymentAddr: string = Config.HIVE_NODE_ADDRESS;

    private provider: WalletConnectProvider;
    private web3: Web3;
    private contract;

    private accountAddress: string;

    /**
     * @param testnet to switch between mainnet and testnet
     */
    constructor(testnet = false) {
        this.setTestMode(testnet);
        log.info(TAG, 'this.rpc: %j', this.rpc);
    }

    /**
     * for init.
     */
    async initialize(): Promise<WalletConnector> {
        await this.initProvider();
        this.web3 = new Web3(this.provider as any);
        this.accountAddress = (await this.web3.eth.getAccounts())[0];
        this.contract = new this.web3.eth.Contract(paymentAbi as any, this.paymentAddr);
        log.info('connector initialized.');
        return this;
    }

    getWeb3(): Web3 {
        return this.web3;
    }

    getContract() {
        return this.contract;
    }

    getAccountAddress() {
        return this.accountAddress;
    }

    getReceiverAddress() {
        return this.paymentAddr;
    }

    private async initProvider() {
        this.provider = new WalletConnectProvider({
            rpc: this.rpc,
            bridge: this.bridge,
            qrcodeModalOptions: {
                mobileLinks: ['essential', 'metamask']
            }
        });

        // Subscribe to accounts change
        this.provider.on('accountsChanged', (accounts: string[]) => {
            log.info(TAG, 'accountsChanged: %j', accounts.length > 0 ? accounts[0] : null);
            if (accounts.length > 0) {
                this.accountAddress = accounts[0];
            }
        });

        // Subscribe to chainId change
        this.provider.on('chainChanged', (chainId: number) => {
            log.info(TAG, 'chainChanged: %j', chainId);
        });

        // wallet error
        this.provider.on('error', (errors) => {
            log.error(TAG, "wallet connect error: %j", errors);
        });

        // Subscribe to session disconnection
        this.provider.on('disconnect', async (code, reason) => {
            log.error(TAG, "disconnect: %j, %j", code, reason);
            await this.closeProvider();
        });

        //  Enable session (triggers QR Code modal)
        await this.provider.enable();
    }

    private async closeProvider() {
        try {
            await this.provider.disconnect();
        } catch (error) {
            log.error(TAG, "failed to disconnect and close: %j", error);
        }
    }

    private setTestMode(mode: boolean) {
        if (mode) {
            this.rpc = Config.CONTRACT_TEST_RPC;
            this.paymentAddr = Config.HIVE_NODE_TEST_ADDRESS;
        } else {
            this.rpc = Config.CONTRACT_RPC;
            this.paymentAddr = Config.HIVE_NODE_ADDRESS;
        }
    }
}
