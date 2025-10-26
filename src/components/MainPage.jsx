import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { useState, useEffect } from 'react';
import { TonClient, Address } from '@ton/ton';
import { parsePluginListAsCell } from '../utils/parsePluginList';
import './MainPage.css';

export const MainPage = () => {
    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const wallet = useTonWallet();
    const [pluginList, setPluginList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPluginList = async () => {
            if (!rawAddress) {
                setPluginList([]);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('Получение списка плагинов для адреса:', rawAddress);

                // Создаем клиент для mainnet
                const client = new TonClient({
                    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
                    // API ключ опционален, но увеличивает лимиты запросов
                    // Получить можно на https://toncenter.com
                });

                // Парсим адрес
                const address = Address.parse(rawAddress);

                // Вызываем get-метод get_plugin_list
                console.log('Вызов get-метода get_plugin_list...');
                const result = await client.runMethod(address, 'get_plugin_list');

                console.log('Результат get-метода:', result);

                // Парсим результат используя утилиту
                // Измените parsePluginListAsCell на нужный парсер из src/utils/parsePluginList.js
                const plugins = parsePluginListAsCell(result.stack);

                setPluginList(plugins);
                console.log('Распарсенные плагины:', plugins);

                if (plugins.length === 0) {
                    setError('Get-метод вернул пустой результат. Возможно, плагины отсутствуют или требуется другой парсер.');
                }
            } catch (err) {
                console.error('Ошибка при получении списка плагинов:', err);

                let errorMessage = 'Не удалось получить список плагинов';

                if (err.message.includes('exit_code')) {
                    errorMessage = 'Get-метод get_plugin_list не найден в смарт-контракте';
                } else if (err.message.includes('network')) {
                    errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(errorMessage);
                setPluginList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPluginList();
    }, [rawAddress]);

    return (
        <div className="main-container">
            <div className="header">
                <div className="logo">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
                        <path d="M20 10L30 18V32L20 24L10 32V18L20 10Z" fill="white" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0088CC" />
                                <stop offset="1" stopColor="#00C6FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1>Extension Manager</h1>
                </div>
                <TonConnectButton />
            </div>

            <div className="content">
                {!wallet ? (
                    <div className="welcome-section">
                        <div className="welcome-icon">
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="60" cy="60" r="60" fill="url(#welcomeGradient)" fillOpacity="0.1" />
                                <circle cx="60" cy="60" r="50" fill="url(#welcomeGradient)" fillOpacity="0.2" />
                                <path d="M60 30L80 45V75L60 60L40 75V45L60 30Z" fill="url(#welcomeGradient)" />
                                <defs>
                                    <linearGradient id="welcomeGradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#0088CC" />
                                        <stop offset="1" stopColor="#00C6FF" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h2>Менеджер расширений TON</h2>
                        <p className="subtitle">
                            Подключите кошелек для просмотра списка установленных плагинов
                        </p>
                        <div className="features">
                            <div className="feature-card">
                                <div className="feature-icon">🔌</div>
                                <h3>Управление плагинами</h3>
                                <p>Просмотр списка установленных расширений</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">⚡</div>
                                <h3>Get-методы</h3>
                                <p>Прямое взаимодействие со смарт-контрактами</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">🔐</div>
                                <h3>Безопасность</h3>
                                <p>Защищенное подключение через TON Connect</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="wallet-section">
                        <div className="wallet-card">
                            <div className="wallet-header">
                                <div className="wallet-icon">
                                    {wallet.imageUrl ? (
                                        <img src={wallet.imageUrl} alt={wallet.name} />
                                    ) : (
                                        <div className="default-icon">💼</div>
                                    )}
                                </div>
                                <div className="wallet-info">
                                    <h3>{wallet.name || 'Неизвестный кошелек'}</h3>
                                    <p className="connection-status">
                                        <span className="status-dot"></span>
                                        Подключен
                                    </p>
                                </div>
                            </div>

                            <div className="address-section">
                                <div className="address-card">
                                    <label>Адрес кошелька</label>
                                    <div className="address-display">
                                        <code>{userFriendlyAddress}</code>
                                        <button
                                            className="copy-button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(userFriendlyAddress);
                                                alert('Адрес скопирован!');
                                            }}
                                            title="Копировать адрес"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="plugins-section">
                                <div className="section-header">
                                    <h3>🔌 Список плагинов</h3>
                                    {loading && <div className="loader"></div>}
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
                                            Этот адрес не содержит плагинов или get-метод недоступен
                                        </span>
                                    </div>
                                )}

                                {!loading && !error && pluginList.length > 0 && (
                                    <div className="plugins-list">
                                        {pluginList.map((plugin, index) => (
                                            <div key={plugin.id || index} className="plugin-item">
                                                <div className="plugin-icon">🧩</div>
                                                <div className="plugin-info">
                                                    <h4>Плагин #{index + 1}</h4>
                                                    <code className="plugin-data">{plugin.data}</code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="info-cards">
                            <div className="info-card">
                                <div className="info-icon">🔗</div>
                                <div className="info-content">
                                    <h4>Протокол</h4>
                                    <p>TON Connect 2.0</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <div className="info-icon">📦</div>
                                <div className="info-content">
                                    <h4>Плагинов</h4>
                                    <p>{loading ? '...' : pluginList.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="footer">
                <p>Powered by TON Connect • React Application</p>
            </footer>
        </div>
    );
};

