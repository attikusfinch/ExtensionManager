import { TonConnectButton, useTonAddress, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { useState, useEffect } from 'react';
import { TonClient } from '@ton/ton';
import { detectWalletVersion, getPluginList } from '../utils/walletDetector';
import { createInstallPluginPayload, createRemovePluginPayload, createPluginTransaction } from '../utils/pluginTransactions';
import { deployPredefinedPlugin } from '../utils/pluginDeploy';
import './MainPage.css';

export const MainPage = () => {
    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const [pluginList, setPluginList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [walletInfo, setWalletInfo] = useState(null);
    const [newPluginAddress, setNewPluginAddress] = useState('');
    const [showAddPlugin, setShowAddPlugin] = useState(false);
    const [showDeployPlugin, setShowDeployPlugin] = useState(false);
    const [txLoading, setTxLoading] = useState(false);

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
                console.log('Получение информации о кошельке:', rawAddress);

                // Создаем клиент для mainnet
                const client = new TonClient({
                    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
                });

                // Детектируем версию кошелька
                const walletVersion = await detectWalletVersion(rawAddress, client);
                setWalletInfo(walletVersion);
                console.log('Версия кошелька:', walletVersion);

                if (!walletVersion.supportsPlugins) {
                    setError('Этот кошелек не поддерживает плагины. Требуется кошелек v4 с поддержкой плагинов.');
                    setPluginList([]);
                    return;
                }

                // Получаем список плагинов
                console.log('Получение списка плагинов...');
                const plugins = await getPluginList(rawAddress, client);

                setPluginList(plugins);
                console.log('Список плагинов:', plugins);

                if (plugins.length === 0) {
                    setError(null); // Нет ошибки, просто нет плагинов
                }
            } catch (err) {
                console.error('Ошибка при получении списка плагинов:', err);

                let errorMessage = 'Не удалось получить список плагинов';

                if (err.message.includes('exit_code')) {
                    errorMessage = 'Get-метод get_plugin_list не найден. Возможно, это не v4 кошелек с плагинами.';
                } else if (err.message.includes('network')) {
                    errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(errorMessage);
                setPluginList([]);
                setWalletInfo({ version: 'unknown', supportsPlugins: false });
            } finally {
                setLoading(false);
            }
        };

        fetchPluginList();
    }, [rawAddress]);

    // Функция установки плагина
    const handleInstallPlugin = async () => {
        if (!newPluginAddress.trim()) {
            alert('Введите адрес плагина');
            return;
        }

        setTxLoading(true);
        try {
            const payload = createInstallPluginPayload(newPluginAddress);
            const transaction = createPluginTransaction(userFriendlyAddress, payload, '0.05');

            await tonConnectUI.sendTransaction(transaction);

            alert('Транзакция отправлена! Плагин будет установлен после подтверждения.');
            setNewPluginAddress('');
            setShowAddPlugin(false);

            // Обновляем список через 3 секунды
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.error('Ошибка установки плагина:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            setTxLoading(false);
        }
    };

    // Функция удаления плагина
    const handleRemovePlugin = async (pluginAddress) => {
        if (!confirm(`Удалить плагин ${pluginAddress}?`)) {
            return;
        }

        setTxLoading(true);
        try {
            const payload = createRemovePluginPayload(pluginAddress);
            const transaction = createPluginTransaction(userFriendlyAddress, payload, '0.01');

            await tonConnectUI.sendTransaction(transaction);

            alert('Транзакция отправлена! Плагин будет удален после подтверждения.');

            // Обновляем список через 3 секунды
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.error('Ошибка удаления плагина:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            setTxLoading(false);
        }
    };

    // Функция деплоя нового плагина
    const handleDeployPlugin = async () => {
        setTxLoading(true);
        try {
            const { transaction, pluginAddress } = deployPredefinedPlugin(userFriendlyAddress, '0.1');

            console.log('Деплой плагина на адрес:', pluginAddress);

            await tonConnectUI.sendTransaction(transaction);

            alert(`Транзакция отправлена!\nПлагин будет задеплоен на адрес:\n${pluginAddress}`);
            setShowDeployPlugin(false);

            // Обновляем список через 5 секунд (деплой может занять больше времени)
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        } catch (error) {
            console.error('Ошибка деплоя плагина:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            setTxLoading(false);
        }
    };

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
                        <div className="welcome-avatar">
                            <img src="user.jpg" alt="Developer" />
                        </div>
                        <h2>Менеджер расширений TON</h2>
                        <p className="subtitle">
                            Подключите кошелек для просмотра списка установленных плагинов
                        </p>
                        <p className="developer-credit">
                            Сделано <a href="https://t.me/fiscaldev" target="_blank" rel="noopener noreferrer">@fiscaldev</a>
                        </p>
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
                                    <div className="header-actions">
                                        {loading && <div className="loader"></div>}
                                        {walletInfo?.supportsPlugins && !loading && (
                                            <>
                                                <button
                                                    className="deploy-plugin-btn"
                                                    onClick={() => setShowDeployPlugin(true)}
                                                    disabled={txLoading}
                                                >
                                                    🚀 Деплой
                                                </button>
                                                <button
                                                    className="add-plugin-btn"
                                                    onClick={() => setShowAddPlugin(true)}
                                                    disabled={txLoading}
                                                >
                                                    ➕ Добавить
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {walletInfo && (
                                    <div className="wallet-version-info">
                                        <span className="version-badge">
                                            {walletInfo.version}
                                            {walletInfo.supportsPlugins && <span className="plugin-support">✓ Плагины</span>}
                                        </span>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-message">
                                        <span className="error-icon">⚠️</span>
                                        <p>{error}</p>
                                    </div>
                                )}

                                {!loading && !error && pluginList.length === 0 && walletInfo?.supportsPlugins && (
                                    <div className="empty-state">
                                        <div className="empty-icon">📭</div>
                                        <p>Плагины не установлены</p>
                                        <span className="empty-hint">
                                            Нажмите "Добавить" чтобы установить первый плагин
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
                                                    <div className="plugin-details">
                                                        <div className="plugin-field">
                                                            <label>Адрес:</label>
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
                                                            <label>Workchain:</label>
                                                            <span>{plugin.workchain}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="remove-plugin-btn"
                                                    onClick={() => handleRemovePlugin(plugin.friendlyAddress)}
                                                    disabled={txLoading}
                                                    title="Удалить плагин"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Модальное окно добавления плагина */}
                                {showAddPlugin && (
                                    <div className="modal-overlay" onClick={() => setShowAddPlugin(false)}>
                                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                            <div className="modal-header">
                                                <h3>Добавить плагин</h3>
                                                <button
                                                    className="modal-close"
                                                    onClick={() => setShowAddPlugin(false)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <label>Адрес плагина:</label>
                                                <input
                                                    type="text"
                                                    className="plugin-input"
                                                    placeholder="EQD... или 0:..."
                                                    value={newPluginAddress}
                                                    onChange={(e) => setNewPluginAddress(e.target.value)}
                                                    disabled={txLoading}
                                                />
                                                <div className="modal-info">
                                                    <p>💡 Будет отправлено ~0.05 TON</p>
                                                    <p>ℹ️ Плагин должен быть уже задеплоен</p>
                                                </div>
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    className="modal-btn cancel"
                                                    onClick={() => setShowAddPlugin(false)}
                                                    disabled={txLoading}
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    className="modal-btn confirm"
                                                    onClick={handleInstallPlugin}
                                                    disabled={txLoading || !newPluginAddress.trim()}
                                                >
                                                    {txLoading ? 'Отправка...' : 'Установить'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Модальное окно деплоя плагина */}
                                {showDeployPlugin && (
                                    <div className="modal-overlay" onClick={() => setShowDeployPlugin(false)}>
                                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                            <div className="modal-header">
                                                <h3>Деплой и установка плагина</h3>
                                                <button
                                                    className="modal-close"
                                                    onClick={() => setShowDeployPlugin(false)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p className="modal-description">
                                                    Будет задеплоен и установлен предустановленный плагин с кодом кошелька v4.
                                                </p>
                                                <div className="modal-info">
                                                    <p>💰 Стоимость деплоя: ~0.1 TON</p>
                                                    <p>📦 Bytecode: встроенный плагин</p>
                                                    <p>⚙️ Операция: op = 1 (deploy + install)</p>
                                                </div>
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    className="modal-btn cancel"
                                                    onClick={() => setShowDeployPlugin(false)}
                                                    disabled={txLoading}
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    className="modal-btn confirm"
                                                    onClick={handleDeployPlugin}
                                                    disabled={txLoading}
                                                >
                                                    {txLoading ? 'Деплой...' : 'Деплой и установить'}
                                                </button>
                                            </div>
                                        </div>
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

