import { TonClient, Address } from '@ton/ton';

/**
 * Детектирует версию кошелька и поддержку плагинов
 */
export async function detectWalletVersion(address, client) {
    try {
        const addr = Address.parse(address);

        // Проверяем наличие get-метода get_plugin_list
        try {
            await client.runMethod(addr, 'get_plugin_list');
            return {
                version: 'v4',
                supportsPlugins: true,
                hasPluginList: true
            };
        } catch (error) {
            // Если get_plugin_list не найден, проверяем другие методы
            if (error.message.includes('exit_code')) {
                // Пробуем определить версию по другим get-методам
                try {
                    await client.runMethod(addr, 'seqno');
                    return {
                        version: 'v3/v4',
                        supportsPlugins: false,
                        hasPluginList: false
                    };
                } catch {
                    return {
                        version: 'unknown',
                        supportsPlugins: false,
                        hasPluginList: false
                    };
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Ошибка детектирования версии:', error);
        return {
            version: 'unknown',
            supportsPlugins: false,
            hasPluginList: false,
            error: error.message
        };
    }
}

/**
 * Получает список плагинов из кошелька v4
 * TODO: Доработать парсинг после того как деплой заработает
 */
export async function getPluginList(address, client) {
  try {
    const addr = Address.parse(address);
    const result = await client.runMethod(addr, 'get_plugin_list');
    
    // Временно просто логируем всю структуру для отладки
    console.log('🔍 get_plugin_list result:', result);
    console.log('📦 Stack:', result.stack);
    console.log('📋 Items:', result.stack.items);
    
    // Пока возвращаем пустой массив - разберемся после деплоя
    return [];
  } catch (error) {
    console.error('Ошибка получения списка плагинов:', error);
    throw error;
  }
}

/**
 * Проверяет установлен ли плагин
 */
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