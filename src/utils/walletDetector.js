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

        console.log('═══════════════════════════════════════');
        console.log('🔍 RAW RESULT:');
        console.log(result);
        console.log('');
        console.log('📦 STACK:');
        console.log(result.stack);
        console.log('');
        console.log('📋 ITEMS:');
        console.log(result.stack.items);
        console.log('');

        const plugins = [];

        if (!result.stack.items || result.stack.items.length === 0) {
            console.log('⚠️ Items пустые');
            return [];
        }

        const firstItem = result.stack.items[0];
        console.log('🎯 FIRST ITEM:');
        console.log(firstItem);
        console.log('Type:', firstItem.type);
        console.log('');

        if (firstItem.type === 'null') {
            console.log('✓ Плагинов нет (null)');
            return [];
        }

        if (firstItem.type === 'tuple' && firstItem.items) {
            console.log('📦 TUPLE найден! Элементов:', firstItem.items.length);
            console.log('');

            firstItem.items.forEach((pair, i) => {
                console.log(`🧩 Плагин #${i}:`);
                console.log('  Type:', pair.type);
                console.log('  Full:', pair);

                if (pair.type === 'tuple' && pair.items && pair.items.length >= 2) {
                    console.log('  ├─ Item 0 (wc):', pair.items[0]);
                    console.log('  └─ Item 1 (addr):', pair.items[1]);

                    const wc = Number(pair.items[0].value);
                    const addrHash = BigInt(pair.items[1].value);

                    const pluginAddress = `${wc}:${addrHash.toString(16).padStart(64, '0')}`;

                    console.log('  ✓ Parsed:', pluginAddress);

                    plugins.push({
                        id: i,
                        workchain: wc,
                        addressHash: addrHash.toString(16).padStart(64, '0'),
                        fullAddress: pluginAddress,
                        friendlyAddress: Address.parseRaw(pluginAddress).toString()
                    });
                }
            });
        }

        console.log('');
        console.log('✅ ИТОГО ПЛАГИНОВ:', plugins.length);
        console.log(plugins);
        console.log('═══════════════════════════════════════');

        return plugins;
    } catch (error) {
        console.error('❌ Ошибка получения списка плагинов:', error);
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