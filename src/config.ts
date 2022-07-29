export class Config {
    static BRIDGE = 'https://walletconnect.elastos.net/v2';
    private static BASE_API = 'elastos.io';

    /** MainNet */
    static CONTRACT_URI = 'https://api.' + Config.BASE_API + '/eth';
    static CONTRACT_RPC = {20: Config.CONTRACT_URI}
    static HIVE_NODE_ADDRESS = '0x59E9f4ff80f3B3A4810b5264EB713DC04F9DFC31';

    /** TestNet */
    static CONTRACT_TEST_URI = 'https://api-testnet.' + Config.BASE_API + '/eth';
    static CONTRACT_TEST_RPC = {21: Config.CONTRACT_TEST_URI}
    static HIVE_NODE_TEST_ADDRESS = '0x81897263EC51A2314d256703b2B9f57664B772a9';
}
