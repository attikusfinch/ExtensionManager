import { useState } from 'react';
import { TonClient, Address } from '@ton/ton';
import './MainPage.css';

export const MainPage = () => {
    const [address, setAddress] = useState('UQCQKEJl-yQU6Ly2JN0OGiUCM3wdL20KrwOy6bbH3Pya5WhP');
    const [pluginList, setPluginList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPlugins = async () => {
        if (!address.trim()) {
            alert('Введите адрес кошелька');
            return;
        }

        setLoading(true);
        setError(null);
        setPluginList([]);

        try {
            console.log('═══════════════════════════════════════');
            console.log('🔍 Запрос плагинов для адреса:', address);

            const client = new TonClient({
                endpoint: 'https://toncenter.com/api/v2/jsonRPC',
            });

            const addr = Address.parse(address);
            console.log('📍 Parsed address:', addr.toString());

            const result = await client.runMethod(addr, 'get_plugin_list');

            console.log('');
            console.log('📊 RAW RESULT:');
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
                setPluginList([]);
                return;
            }

            const firstItem = result.stack.items[0];
            console.log('🎯 FIRST ITEM (TupleReader):');
            console.log(firstItem);
            console.log('');

            // Проверяем есть ли items в TupleReader
            if (!firstItem.items || firstItem.items.length === 0) {
                console.log('⚠️ TupleReader.items пустой');
                setPluginList([]);
                return;
            }

            const innerTuple = firstItem.items[0];
            console.log('📦 INNER TUPLE:');
            console.log(innerTuple);
            console.log('Type:', innerTuple.type);
            console.log('');

            if (innerTuple.type === 'null') {
                console.log('✓ Плагинов нет (type: null)');
                setPluginList([]);
                return;
            }

            // Теперь проверяем items внутреннего tuple
            if (innerTuple.type === 'tuple' && innerTuple.items) {
                console.log('📦 Плагины найдены! Элементов:', innerTuple.items.length);
                console.log('');

                innerTuple.items.forEach((pair, i) => {
                    console.log(`🧩 Плагин #${i}:`);
                    console.log('  Full object:', pair);

                    // Каждый элемент - это массив [wc, addr]
                    if (Array.isArray(pair) && pair.length >= 2) {
                        console.log('  ├─ [0] (wc):', pair[0]);
                        console.log('  └─ [1] (addr):', pair[1]);

                        const wc = Number(pair[0]);
                        const addrHash = BigInt(pair[1]);

                        const pluginAddress = `${wc}:${addrHash.toString(16).padStart(64, '0')}`;

                        console.log('  ✓ Workchain:', wc);
                        console.log('  ✓ Address hash:', addrHash.toString(16).padStart(64, '0'));
                        console.log('  ✓ Raw address:', pluginAddress);

                        try {
                            const friendly = Address.parseRaw(pluginAddress).toString();
                            console.log('  ✓ Friendly address:', friendly);

                            plugins.push({
                                id: i,
                                workchain: wc,
                                addressHash: addrHash.toString(16).padStart(64, '0'),
                                fullAddress: pluginAddress,
                                friendlyAddress: friendly
                            });
                        } catch (e) {
                            console.error('  ❌ Ошибка парсинга адреса:', e);
                        }
                    }
                    console.log('');
                });
            }

            console.log('✅ ИТОГО ПЛАГИНОВ:', plugins.length);
            console.log('Parsed plugins:', plugins);
            console.log('═══════════════════════════════════════');

            setPluginList(plugins);

        } catch (err) {
            console.error('❌ ОШИБКА:', err);
            setError(err.message || 'Не удалось получить список плагинов');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-container">
            <div className="header">
                <div className="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
                        <path d="M20 10L30 18V32L20 24L10 32V18L20 10Z" fill="white" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                                <stop stopColor="#0088CC" />
                                <stop offset="1" stopColor="#00C6FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1>Extension Manager</h1>
                </div>
            </div>

            <div className="content">
                <div className="test-section">
                    <div className="test-card">
                        <h2>🧪 Тест парсинга плагинов</h2>

                        <div className="input-group">
                            <label>Адрес кошелька:</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="UQC... или EQ..."
                                disabled={loading}
                            />
                        </div>

                        <button
                            className="test-button"
                            onClick={fetchPlugins}
                            disabled={loading}
                        >
                            {loading ? '⏳ Загрузка...' : '🔍 Получить список плагинов'}
                        </button>

                        <div className="info-hint">
                            💡 Откройте консоль браузера (F12) чтобы увидеть подробные логи парсинга
                        </div>

                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && pluginList.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <p>Плагины не найдены</p>
                                <span className="empty-hint">
                                    Введите адрес и нажмите кнопку
                                </span>
                            </div>
                        )}

                        {!loading && !error && pluginList.length > 0 && (
                            <div className="plugins-list">
                                <h3>✅ Найдено плагинов: {pluginList.length}</h3>
                                {pluginList.map((plugin, index) => (
                                    <div key={plugin.id || index} className="plugin-item">
                                        <div className="plugin-icon">🧩</div>
                                        <div className="plugin-info">
                                            <h4>Плагин #{index + 1}</h4>
                                            <div className="plugin-details">
                                                <div className="plugin-field">
                                                    <label>Friendly:</label>
                                                    <code className="plugin-address">{plugin.friendlyAddress}</code>
                                                    <button
                                                        className="copy-btn-small"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(plugin.friendlyAddress);
                                                            alert('Адрес скопирован!');
                                                        }}
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                                <div className="plugin-field">
                                                    <label>Raw:</label>
                                                    <code className="plugin-address">{plugin.fullAddress}</code>
                                                </div>
                                                <div className="plugin-field">
                                                    <label>Workchain:</label>
                                                    <span>{plugin.workchain}</span>
                                                </div>
                                                <div className="plugin-field">
                                                    <label>Hash:</label>
                                                    <code style={{ fontSize: '0.75rem' }}>{plugin.addressHash}</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="footer">
                <p>Сделано <a href="https://t.me/fiscaldev" target="_blank" rel="noopener noreferrer">@fiscaldev</a></p>
            </footer>
        </div>
    );
};
