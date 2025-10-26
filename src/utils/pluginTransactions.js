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
        console.log('📋 Items:', result.stack.items);

        const plugins = [];

        // Проверяем есть ли данные
        if (!result.stack.items || result.stack.items.length === 0) {
            return [];
        }

        const firstItem = result.stack.items[0];
        console.log('First item:', firstItem);

        // Если null - плагинов нет
        if (firstItem.type === 'null') {
            console.log('✓ Плагинов нет (null)');
            return [];
        }

        // Если tuple - парсим плагины
        if (firstItem.type === 'tuple' && firstItem.items) {
            console.log('📦 Found tuple with', firstItem.items.length, 'items');

            for (let i = 0; i < firstItem.items.length; i++) {
                const pair = firstItem.items[i];
                console.log(`  Plugin ${i}:`, pair);

                if (pair.type === 'tuple' && pair.items && pair.items.length >= 2) {
                    const wc = Number(pair.items[0].value);
                    const addrHash = BigInt(pair.items[1].value);

                    const pluginAddress = `${wc}:${addrHash.toString(16).padStart(64, '0')}`;

                    plugins.push({
                        id: i,
                        workchain: wc,
                        addressHash: addrHash.toString(16).padStart(64, '0'),
                        fullAddress: pluginAddress,
                        friendlyAddress: Address.parseRaw(pluginAddress).toString()
                    });
                }
            }
        }

        console.log('✅ Parsed plugins:', plugins);
        return plugins;
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