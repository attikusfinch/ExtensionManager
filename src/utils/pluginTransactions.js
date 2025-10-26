import { beginCell, Address } from '@ton/ton';

export function createInstallPluginPayload(pluginAddress, amount = 50000000n, queryId = 0n) {
    try {
        const addr = Address.parse(pluginAddress);
        const wc = addr.workChain;
        const hash = BigInt('0x' + addr.hash.toString('hex'));

        const body = beginCell()
            .storeUint(2, 8)
            .storeInt(wc, 8)
            .storeUint(hash, 256)
            .storeCoins(amount)
            .storeUint(queryId, 64)
            .endCell();

        return body.toBoc().toString('base64');
    } catch (error) {
        console.error('Ошибка создания payload для установки:', error);
        throw error;
    }
}

export function createRemovePluginPayload(pluginAddress, amount = 10000000n, queryId = 0n) {
    try {
        const addr = Address.parse(pluginAddress);
        const wc = addr.workChain;
        const hash = BigInt('0x' + addr.hash.toString('hex'));

        const body = beginCell()
            .storeUint(3, 8)
            .storeInt(wc, 8)
            .storeUint(hash, 256)
            .storeCoins(amount)
            .storeUint(queryId, 64)
            .endCell();

        return body.toBoc().toString('base64');
    } catch (error) {
        console.error('Ошибка создания payload для удаления:', error);
        throw error;
    }
}

export function createPluginTransaction(walletAddress, payload, amount = '0.05') {
    const amountNano = Math.floor(parseFloat(amount) * 1e9).toString();

    return {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
            address: walletAddress,
            amount: amountNano,
            payload: payload
        }]
    };
}