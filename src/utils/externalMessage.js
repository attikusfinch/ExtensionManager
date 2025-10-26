import { beginCell, Address } from '@ton/ton';
import { mnemonicToPrivateKey, sign } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

/**
 * Получает seqno кошелька
 */
async function getSeqno(walletAddress) {
    try {
        const response = await fetch(
            `https://toncenter.com/api/v2/runGetMethod?address=${walletAddress}&method=seqno`
        );
        const data = await response.json();

        if (data.result && data.result.stack && data.result.stack.length > 0) {
            return parseInt(data.result.stack[0][1], 16);
        }

        return 0;
    } catch (error) {
        console.error('Ошибка получения seqno:', error);
        return 0;
    }
}

/**
 * Получает subwallet_id кошелька
 */
async function getSubwalletId(walletAddress) {
    try {
        const response = await fetch(
            `https://toncenter.com/api/v2/runGetMethod?address=${walletAddress}&method=get_subwallet_id`
        );
        const data = await response.json();

        if (data.result && data.result.stack && data.result.stack.length > 0) {
            return parseInt(data.result.stack[0][1], 16);
        }

        return 698983191; // default для v4r2
    } catch (error) {
        console.error('Ошибка получения subwallet_id:', error);
        return 698983191;
    }
}

/**
 * Создает external message для установки плагина (op = 2)
 */
export async function createInstallPluginExternalMessage(
    mnemonicWords,
    walletAddress,
    pluginAddress,
    amount = 50000000 n
) {
    try {
        console.log('🔐 Создание external message для установки плагина (op=2)');

        // Получаем ключи из мнемоники
        const keyPair = await mnemonicToPrivateKey(mnemonicWords.split(' '));
        console.log('✓ Ключи получены');

        // Получаем данные кошелька
        const seqno = await getSeqno(walletAddress);
        const subwalletId = await getSubwalletId(walletAddress);

        console.log('📊 Seqno:', seqno);
        console.log('🔑 Subwallet ID:', subwalletId);

        // Парсим адрес плагина
        const pluginAddr = Address.parse(pluginAddress);
        const wc = pluginAddr.workChain;
        const hash = pluginAddr.hash;

        console.log('📍 Plugin WC:', wc);
        console.log('📍 Plugin Hash:', hash.toString('hex'));

        // Создаем тело сообщения (без подписи)
        const validUntil = Math.floor(Date.now() / 1000) + 600;
        const queryId = BigInt(Date.now());

        // Структура согласно recv_external + op=2
        const bodyToSign = beginCell()
            .storeUint(subwalletId, 32) // subwallet_id
            .storeUint(validUntil, 32) // valid_until
            .storeUint(seqno, 32) // msg_seqno
            .storeUint(2, 8) // op = 2 (install plugin)
            .storeInt(wc, 8) // workchain
            .storeUint(BigInt('0x' + hash.toString('hex')), 256) // address hash
            .storeCoins(amount) // amount
            .storeUint(queryId, 64) // query_id
            .endCell();

        // Подписываем
        const signature = sign(bodyToSign.hash(), keyPair.secretKey);
        console.log('✓ Сообщение подписано');

        // Создаем финальное тело с подписью
        const body = beginCell()
            .storeBuffer(signature)
            .storeSlice(bodyToSign.asSlice())
            .endCell();

        // Создаем external message
        const externalMessage = beginCell()
            .storeUint(0b10, 2) // ext_in_msg_info$10
            .storeUint(0, 2) // src:MsgAddressExt (addr_none$00)
            .storeAddress(Address.parse(walletAddress))
            .storeCoins(0)
            .storeBit(0) // no state_init
            .storeBit(1) // body as ref
            .storeRef(body)
            .endCell();

        const boc = externalMessage.toBoc().toString('base64');
        console.log('✅ External message создан, размер:', boc.length);

        return boc;
    } catch (error) {
        console.error('❌ Ошибка создания external message:', error);
        throw error;
    }
}

/**
 * Создает external message для удаления плагина (op = 3)
 */
export async function createRemovePluginExternalMessage(
    mnemonicWords,
    walletAddress,
    pluginAddress,
    amount = 50000000 n
) {
    try {
        console.log('🔐 Создание external message для удаления плагина (op=3)');

        const keyPair = await mnemonicToPrivateKey(mnemonicWords.split(' '));
        console.log('✓ Ключи получены');

        const seqno = await getSeqno(walletAddress);
        const subwalletId = await getSubwalletId(walletAddress);

        console.log('📊 Seqno:', seqno);
        console.log('🔑 Subwallet ID:', subwalletId);

        const pluginAddr = Address.parse(pluginAddress);
        const wc = pluginAddr.workChain;
        const hash = pluginAddr.hash;

        console.log('📍 Plugin WC:', wc);
        console.log('📍 Plugin Hash:', hash.toString('hex'));

        const validUntil = Math.floor(Date.now() / 1000) + 600;
        const queryId = BigInt(Date.now());

        // Структура согласно recv_external + op=3
        const bodyToSign = beginCell()
            .storeUint(subwalletId, 32)
            .storeUint(validUntil, 32)
            .storeUint(seqno, 32)
            .storeUint(3, 8) // op = 3 (remove plugin)
            .storeInt(wc, 8)
            .storeUint(BigInt('0x' + hash.toString('hex')), 256)
            .storeCoins(amount)
            .storeUint(queryId, 64)
            .endCell();

        const signature = sign(bodyToSign.hash(), keyPair.secretKey);
        console.log('✓ Сообщение подписано');

        const body = beginCell()
            .storeBuffer(signature)
            .storeSlice(bodyToSign.asSlice())
            .endCell();

        const externalMessage = beginCell()
            .storeUint(0b10, 2)
            .storeUint(0, 2)
            .storeAddress(Address.parse(walletAddress))
            .storeCoins(0)
            .storeBit(0)
            .storeBit(1)
            .storeRef(body)
            .endCell();

        const boc = externalMessage.toBoc().toString('base64');
        console.log('✅ External message создан, размер:', boc.length);

        return boc;
    } catch (error) {
        console.error('❌ Ошибка создания external message:', error);
        throw error;
    }
}

/**
 * Отправляет external message в сеть
 */
export async function sendExternalMessage(boc) {
    try {
        console.log('📤 Отправка external message...');

        const response = await fetch('https://toncenter.com/api/v2/sendBoc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                boc: boc
            })
        });

        const data = await response.json();
        console.log('📨 Ответ от TonCenter:', data);

        if (data.ok) {
            console.log('✅ External message отправлен успешно!');
            console.log('Hash:', data.result ? .hash);
            return data.result;
        } else {
            throw new Error(data.error || 'Ошибка отправки');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        throw error;
    }
}