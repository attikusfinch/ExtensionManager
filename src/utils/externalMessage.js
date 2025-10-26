const { Asset, PoolType, ReadinessStatus, JettonRoot, JettonWallet, Pool } = require('@dedust/sdk');
const { Address, toNano, beginCell } = require('@ton/core');
const { Factory, MAINNET_FACTORY_ADDR, VaultJetton, VaultNative, Vault } = require('@dedust/sdk');
const { mnemonicToPrivateKey } = require("@ton/crypto");
const { WalletContractV5R1, internal, WalletContractV4 } = require("@ton/ton");
const { loadOutListExtendedV5R1 } = require("@ton/ton/dist/wallets/v5r1/WalletV5R1Actions")
const { calcJettonWalletAddress, getJettonDataOnChain } = require("./../transferWallet");

const PendingDatabaseWrapper = require('./../database/pendingDBHooks');

const pendingDB = new PendingDatabaseWrapper();

const DEFAULT_TON = Asset.native();
const DEFAULT_GAS_AMOUNT = "0.25";

class VaultNativeExt extends VaultNative {
    constructor(address) {
        super(address);
    }
    static createFromAddress(address) {
        return new VaultNativeExt(address);
    }
    async sendSwap(provider, via, { queryId, amount, poolAddress, limit, swapParams, next, gasAmount, }) {
        // await provider.internal(via, {
        //     sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
        //     body: (0, core_1.beginCell)()
        //         .storeUint(VaultNative.SWAP, 32)
        //         .storeUint(queryId ?? 0, 64)
        //         .storeCoins(amount)
        //         .storeAddress(poolAddress)
        //         .storeUint(0, 1)
        //         .storeCoins(limit ?? 0)
        //         .storeMaybeRef(next ? Vault.packSwapStep(next) : null)
        //         .storeRef(Vault.packSwapParams(swapParams ?? {}))
        //         .endCell(),
        //     value: amount + (gasAmount ?? toNano('0.2')),
        // });

        return {
            to: this.address,
            value: amount + (gasAmount ? ? toNano('0.2')),
            body: beginCell()
                .storeUint(VaultNative.SWAP, 32)
                .storeUint(queryId ? ? 0, 64)
                .storeCoins(amount)
                .storeAddress(poolAddress)
                .storeUint(0, 1)
                .storeCoins(limit ? ? 0)
                .storeMaybeRef(next ? Vault.packSwapStep(next) : null)
                .storeRef(Vault.packSwapParams(swapParams ? ? {}))
                .endCell()
        }
    }
}

class FactoryExt extends Factory {
    constructor(address) {
        super(address);
    }
    static createFromAddress(address) {
        return new FactoryExt(address);
    }

    async getNativeVaultExt(provider) {
        const nativeVaultAddress = await this.getVaultAddress(provider, Asset.native());
        return VaultNativeExt.createFromAddress(nativeVaultAddress);
    }
}

class JettonWalletExt extends JettonWallet {
    constructor(address) {
        super(address);
    }
    static createFromAddress(address) {
        return new JettonWalletExt(address);
    }

    async sendTransfer(provider, via, value, { queryId, amount, destination, responseAddress, customPayload, forwardAmount, forwardPayload, }) {
        return {
            to: this.address,
            value,
            body: beginCell()
                .storeUint(JettonWallet.TRANSFER, 32)
                .storeUint(queryId ? ? 0, 64)
                .storeCoins(amount)
                .storeAddress(destination)
                .storeAddress(responseAddress)
                .storeMaybeRef(customPayload)
                .storeCoins(forwardAmount ? ? 0)
                .storeMaybeRef(forwardPayload)
                .endCell()
        }
    }
}

async function findPair(tonClient, jettonAddress, tonAsset = DEFAULT_TON) {
    const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const JETTON = Asset.jetton(Address.parse(jettonAddress));
    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [tonAsset, JETTON]));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error(`Pool (${tonAsset.name}, ${JETTON.name}) does not exist.`);
    }

    return pool;
}

async function getEstimateAmount(tonClient, assetIn, amountIn, jettonAddress, tonAsset = DEFAULT_TON) {
    const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    let assetInContract = assetIn === DEFAULT_TON ? DEFAULT_TON : JETTON

    const pool = tonClient.open(await factory.getPool(PoolType.VOLATILE, [tonAsset, JETTON]));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error(`Pool (${tonAsset.name}, ${JETTON.name}) does not exist.`);
    }

    return await pool.getEstimatedSwapOut({
        assetIn: assetInContract,
        amountIn: toNano(amountIn)
    });
}

async function buy({
    tonClient,
    mnemonics,
    amountInTON,
    jettonAddress,
    slippage = 5 n,
    gasAmount = DEFAULT_GAS_AMOUNT
}) {
    const factory = tonClient.open(FactoryExt.createFromAddress(MAINNET_FACTORY_ADDR));

    const keyPair = await mnemonicToPrivateKey(mnemonics);

    const wallet = tonClient.open(WalletContractV5R1.create({
        publicKey: keyPair.publicKey,
        workChain: 0
    }));

    const sender = wallet.sender(keyPair.secretKey);

    const pool = await findPair(tonClient, jettonAddress);
    const tonVault = tonClient.open(await factory.getNativeVaultExt());

    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error(`Vault (${DEFAULT_TON.name}) does not exist.`);
    }

    const { amountOut } = await pool.getEstimatedSwapOut({
        assetIn: Asset.native(),
        amountIn: toNano(amountInTON)
    });

    const minAmountOut = (amountOut * (100 n - slippage)) / 100 n;

    let txParams = await tonVault.sendSwap(sender, {
        poolAddress: pool.address,
        amount: toNano(amountInTON),
        limit: minAmountOut,
        gasAmount: toNano(gasAmount),
    });

    let txFee = {
        to: Address.parse("UQD1KZNlg7m-8ymJqNKSA15nmc2ftTS1kyUlSuGonqr0bFas"), // Your fee address
        value: toNano('0.2'), // fee amount, can be dynamicly calculated, just don't forget to toNano it!!
        body: "best trade bot fee" // comment for advertising 
    }

    let tx = await wallet.createTransfer({
        seqno: await wallet.getSeqno(),
        secretKey: keyPair.secretKey,
        messages: [internal(txParams), internal(txFee)]
    })

    await wallet.send(tx);

    const data = tx.beginParse();

    data.skip(128);

    loadOutListExtendedV5R1(data);

    let signature = data.loadBuffer(64);

    let signatureHex = signature.toString("hex");

    const txHash = tx.hash().toString("hex");

    await pendingDB.insertRecord(Date.now(), txHash, signatureHex, wallet.address.toRawString());

    return {
        minAmountOut
    }
}

async function sell({
    tonClient,
    mnemonics,
    amountInJetton,
    jettonAddress,
    slippage = 5 n,
    gasAmount = DEFAULT_GAS_AMOUNT
}) {
    const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const keyPair = await mnemonicToPrivateKey(mnemonics);

    const wallet = tonClient.open(WalletContractV5R1.create({
        publicKey: keyPair.publicKey,
        workChain: 0
    }));

    const sender = wallet.sender(keyPair.secretKey);

    const pool = await findPair(tonClient, jettonAddress);

    const JETTON = Asset.jetton(Address.parse(jettonAddress));

    const offerJetton = await getJettonDataOnChain(tonClient, jettonAddress);

    const offerJettonDecimals = offerJetton ? .decimals || 9;

    const jettonVault = tonClient.open(await factory.getJettonVault(Address.parse(jettonAddress)));
    const jettonRoot = tonClient.open(JettonRoot.createFromAddress(Address.parse(jettonAddress)));
    const jettonAddressWallet = await jettonRoot.getWallet(wallet.address);

    const jettonWallet = tonClient.open(JettonWalletExt.createFromAddress(jettonAddressWallet.address));

    if ((await jettonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error(`Vault (${jettonRoot.name}) does not exist.`);
    }

    const { amountOut } = await pool.getEstimatedSwapOut({
        assetIn: JETTON,
        amountIn: amountInJetton * 10 ** offerJettonDecimals
    });

    const minAmountOut = (amountOut * (100 n - slippage)) / 100 n;

    let txParams = await jettonWallet.sendTransfer(sender, toNano("0.3"), {
        amount: amountInJetton * 10 ** offerJettonDecimals,
        destination: jettonVault.address,
        responseAddress: sender.address, // Return gas to user
        forwardAmount: toNano(gasAmount),
        forwardPayload: VaultJetton.createSwapPayload({ poolAddress: pool.address, limit: minAmountOut }),
    });

    let tx = await wallet.createTransfer({
        seqno: await wallet.getSeqno(),
        secretKey: keyPair.secretKey,
        messages: [internal(txParams)]
    })

    await wallet.send(tx);

    const data = tx.beginParse();

    data.skip(128);

    loadOutListExtendedV5R1(data);

    let signature = data.loadBuffer(64);

    let signatureHex = signature.toString("hex");

    const txHash = tx.hash().toString("hex");

    await pendingDB.insertRecord(Date.now(), txHash, signatureHex, wallet.address.toRawString());

    return {
        minAmountOut
    }
}

async function openDedustPool(tonClient, poolAddress) {
    const pool = tonClient.open(Pool.createFromAddress(Address.parse(poolAddress)));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error(`Pool (${tonAsset.name}, ${JETTON.name}) does not exist.`);
    }

    return pool;
}

module.exports = { findPair, buy, sell, getEstimateAmount, openDedustPool };