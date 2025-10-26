import { beginCell, Address } from '@ton/ton';

/**
 * Создает payload для установки плагина (op = 2)
 */
export function createInstallPluginPayload(pluginAddress, amount = 50000000n, queryId = 0n) {
  try {
    const addr = Address.parse(pluginAddress);
    const wc = addr.workChain;
    const hash = BigInt('0x' + addr.hash.toString('hex'));
    
    // Внешнее сообщение с op = 2 (install plugin)
    const body = beginCell()
      .storeUint(2, 8)  // op = 2 (install plugin)
      .storeInt(wc, 8)  // workchain
      .storeUint(hash, 256)  // address hash
      .storeCoins(amount)  // amount
      .storeUint(queryId, 64)  // query_id
      .endCell();
    
    return body.toBoc().toString('base64');
  } catch (error) {
    console.error('Ошибка создания payload для установки плагина:', error);
    throw error;
  }
}

/**
 * Создает payload для удаления плагина (op = 3)
 */
export function createRemovePluginPayload(pluginAddress, amount = 10000000n, queryId = 0n) {
  try {
    const addr = Address.parse(pluginAddress);
    const wc = addr.workChain;
    const hash = BigInt('0x' + addr.hash.toString('hex'));
    
    // Внешнее сообщение с op = 3 (remove plugin)
    const body = beginCell()
      .storeUint(3, 8)  // op = 3 (remove plugin)
      .storeInt(wc, 8)  // workchain
      .storeUint(hash, 256)  // address hash
      .storeCoins(amount)  // amount
      .storeUint(queryId, 64)  // query_id
      .endCell();
    
    return body.toBoc().toString('base64');
  } catch (error) {
    console.error('Ошибка создания payload для удаления плагина:', error);
    throw error;
  }
}

/**
 * Создает параметры транзакции для TON Connect
 */
export function createPluginTransaction(walletAddress, payload, amount = '0.05') {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
    messages: [
      {
        address: walletAddress,
        amount: amount, // В TON
        payload: payload
      }
    ]
  };
}

