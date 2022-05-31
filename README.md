# Elastos Hive Payment JS SDK

Elastos Hive Payment JS SDK is for the payment service of [Elastos Hive JS SDK](https://github.com/elastos/Elastos.Hive.JS.SDK)

The payment service supports essentials and metamask applications.

## Install

```shell
npm i --save @elastosfoundation/hive-payment-js-sdk
```

## Build

```shell
git clone https://github.com/elastos-trinity/Elastos.Hive.Payment.JS.SDK.git
cd Elastos.Hive.Payment.JS.SDK
npm install
npm run build
```

## Usage

mainnet usage:

```typescript
// mainnet
const contract = await new PaymentContract().initialize();

// access API
const newOrderId = contract.payOrder(2.5, dstWalletAddress, orderProof)
const orders = contract.getOrders();
const order = contract.getOrder(1023);
```                                           

testnet usage:

```typescript
// testnet
const contract = await new PaymentContract(true).initialize();

// access API
const newOrderId = contract.payOrder(2.5, dstWalletAddress, orderProof)
const orders = contract.getOrders();
const order = contract.getOrder(1023);
```
