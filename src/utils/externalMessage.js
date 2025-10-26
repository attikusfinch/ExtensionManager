import { beginCell, Address, sign } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

/**
 * Создает и подписывает external message для удаления плагина (op = 3)
 */
export async function createRemovePluginExternalMessage(
  mnemonic,
  walletAddress,
  pluginAddress,
  subwalletId = 698983191,
  amount = 50000000n
) {
  try {
    console.log('🔐 Создание external message для удаления плагина');
    
    // Получаем ключи из мнемоники
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    console.log('✓ Ключи получены из мнемоники');
    
    // Получаем seqno
    const seqno = await getSeqno(walletAddress);
    console.log('📊 Seqno:', seqno);
    
    // Парсим адрес плагина
    const pluginAddr = Address.parse(pluginAddress);
    const wc = pluginAddr.workChain;
    const hash = pluginAddr.hash;
    
    console.log('📍 Plugin WC:', wc);
    console.log('📍 Plugin Hash:', hash.toString('hex'));
    
    // Создаем тело сообщения (без подписи)
    const validUntil = Math.floor(Date.now() / 1000) + 600; // 10 минут
    const queryId = BigInt(Date.now());
    
    const messageBody = beginCell()
      .storeUint(subwalletId, 32)
      .storeUint(validUntil, 32)
      .storeUint(seqno, 32)
      .storeUint(3, 8)  // op = 3 (remove plugin)
      .storeInt(wc, 8)
      .storeUint(BigInt('0x' + hash.toString('hex')), 256)
      .storeCoins(amount)
      .storeUint(queryId, 64)
      .endCell();
    
    // Подписываем
    const signature = sign(messageBody.hash(), keyPair.secretKey);
    console.log('✓ Сообщение подписано');
    
    // Создаем финальное тело с подписью
    const body = beginCell()
      .storeBuffer(signature)
      .storeSlice(messageBody.asSlice())
      .endCell();
    
    // Создаем external message
    const externalMessage = beginCell()
      .storeUint(0b10, 2)  // ext_in_msg_info$10
      .storeUint(0, 2)     // src:MsgAddressExt
      .storeAddress(Address.parse(walletAddress))  // dest
      .storeCoins(0)       // import_fee
      .storeBit(0)         // no state_init
      .storeBit(1)         // body as ref
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
 * Отправляет external message в блокчейн
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
    console.log('📨 Ответ от API:', data);
    
    if (data.ok) {
      console.log('✅ External message отправлен успешно!');
      return data.result;
    } else {
      throw new Error(data.error || 'Ошибка отправки');
    }
  } catch (error) {
    console.error('❌ Ошибка отправки external message:', error);
    throw error;
  }
}

