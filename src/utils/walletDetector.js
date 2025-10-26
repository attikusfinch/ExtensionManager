import { Address } from '@ton/ton';

export async function detectWalletVersion(address, client) {
  try {
    const addr = Address.parse(address);
    try {
      await client.runMethod(addr, 'get_plugin_list');
      return { version: 'v4', supportsPlugins: true, hasPluginList: true };
    } catch (error) {
      if (error.message.includes('exit_code')) {
        try {
          await client.runMethod(addr, 'seqno');
          return { version: 'v3/v4', supportsPlugins: false, hasPluginList: false };
        } catch {
          return { version: 'unknown', supportsPlugins: false, hasPluginList: false };
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Ошибка детектирования версии:', error);
    return { version: 'unknown', supportsPlugins: false, hasPluginList: false, error: error.message };
  }
}

export async function getPluginList(address, client) {
  try {
    const addr = Address.parse(address);
    const result = await client.runMethod(addr, 'get_plugin_list');
    console.log('🔍 get_plugin_list result:', result);
    console.log('📦 Stack:', result.stack);
    console.log('📋 Items:', result.stack.items);
    return [];
  } catch (error) {
    console.error('Ошибка получения списка плагинов:', error);
    throw error;
  }
}

export async function isPluginInstalled(walletAddress, pluginWc, pluginAddr, client) {
  try {
    const addr = Address.parse(walletAddress);
    const result = await client.runMethod(addr, 'is_plugin_installed', [
      { type: 'int', value: BigInt(pluginWc) },
      { type: 'int', value: BigInt('0x' + pluginAddr) }
    ]);
    return result.stack.readNumber() !== 0;
  } catch (error) {
    console.error('Ошибка проверки плагина:', error);
    return false;
  }
}

