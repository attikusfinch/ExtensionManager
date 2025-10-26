import { useState } from 'react';
import { TonClient, Address } from '@ton/ton';
import { createInstallPluginExternalMessage, createRemovePluginExternalMessage, sendExternalMessage } from '../utils/externalMessage';
import './MainPage.css';

const translations = {
  ru: {
    title: 'Plugin Manager',
    testParsing: '🧪 Тест парсинга плагинов',
    walletAddress: 'Адрес кошелька:',
    getPlugins: 'Получить список плагинов',
    installPlugin: 'Установить плагин',
    loading: 'Загрузка...',
    consoleHint: 'Откройте консоль браузера (F12) чтобы увидеть подробные логи парсинга',
    noPlugins: 'Плагины не найдены',
    enterAddress: 'Введите адрес и нажмите кнопку',
    found: 'Найдено плагинов:',
    plugin: 'Плагин',
    friendly: 'Friendly:',
    raw: 'Raw:',
    workchain: 'Workchain:',
    hash: 'Hash:',
    installTitle: 'Установка плагина',
    pluginAddress: 'Адрес плагина:',
    seedPhrase: 'Seed фраза (24 слова):',
    seedNotSaved: 'Seed фраза не сохраняется',
    opInstall: 'External message с op=2 (install plugin)',
    opRemove: 'External message с op=3 (remove plugin)',
    amount: 'Amount: 0.05 TON на плагин',
    cancel: 'Отмена',
    install: 'Установить',
    installing: 'Установка...',
    removeTitle: 'Удаление плагина',
    remove: 'Удалить плагин',
    removing: 'Удаление...',
    madeBy: 'Сделано'
  },
  en: {
    title: 'Plugin Manager',
    testParsing: '🧪 Test Plugin Parsing',
    walletAddress: 'Wallet Address:',
    getPlugins: 'Get Plugin List',
    installPlugin: 'Install Plugin',
    loading: 'Loading...',
    consoleHint: 'Open browser console (F12) to see detailed parsing logs',
    noPlugins: 'No plugins found',
    enterAddress: 'Enter address and click button',
    found: 'Plugins found:',
    plugin: 'Plugin',
    friendly: 'Friendly:',
    raw: 'Raw:',
    workchain: 'Workchain:',
    hash: 'Hash:',
    installTitle: 'Install Plugin',
    pluginAddress: 'Plugin Address:',
    seedPhrase: 'Seed Phrase (24 words):',
    seedNotSaved: 'Seed phrase is not saved',
    opInstall: 'External message with op=2 (install plugin)',
    opRemove: 'External message with op=3 (remove plugin)',
    amount: 'Amount: 0.05 TON to plugin',
    cancel: 'Cancel',
    install: 'Install',
    installing: 'Installing...',
    removeTitle: 'Remove Plugin',
    remove: 'Remove Plugin',
    removing: 'Removing...',
    madeBy: 'Made by'
  }
};

export const MainPage = () => {
  const [address, setAddress] = useState('');
  const [pluginList, setPluginList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonicInput, setShowMnemonicInput] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [showInstallPlugin, setShowInstallPlugin] = useState(false);
  const [newPluginAddress, setNewPluginAddress] = useState('');
  const [lang, setLang] = useState('ru');

  const t = translations[lang];

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
      console.log('Is Array?', Array.isArray(innerTuple));
      console.log('Type:', innerTuple.type);
      console.log('');

      // Если innerTuple - это сразу массив [wc, addr] одного плагина
      if (Array.isArray(innerTuple) && innerTuple.length >= 2) {
        console.log('🧩 Это один плагин (массив [wc, addr])');
        console.log('  ├─ [0] (wc):', innerTuple[0]);
        console.log('  └─ [1] (addr):', innerTuple[1]);

        const wc = Number(innerTuple[0]);
        const addrHash = BigInt(innerTuple[1]);

        const pluginAddress = `${wc}:${addrHash.toString(16).padStart(64, '0')}`;

        console.log('  ✓ Workchain:', wc);
        console.log('  ✓ Address hash:', addrHash.toString(16).padStart(64, '0'));
        console.log('  ✓ Raw address:', pluginAddress);

        try {
          const friendly = Address.parseRaw(pluginAddress).toString();
          console.log('  ✓ Friendly address:', friendly);

          plugins.push({
            id: 0,
            workchain: wc,
            addressHash: addrHash.toString(16).padStart(64, '0'),
            fullAddress: pluginAddress,
            friendlyAddress: friendly
          });
        } catch (e) {
          console.error('  ❌ Ошибка парсинга адреса:', e);
        }
      }
      // Если innerTuple - это объект с items (несколько плагинов)
      else if (innerTuple.type === 'tuple' && innerTuple.items) {
        console.log('📦 Несколько плагинов! Элементов:', innerTuple.items.length);
        console.log('');

        innerTuple.items.forEach((pair, i) => {
          console.log(`🧩 Плагин #${i}:`);
          console.log('  Full object:', pair);

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

  const handleRemovePlugin = async (plugin) => {
    setSelectedPlugin(plugin);
    setShowMnemonicInput(true);
  };

  const handleInstallPlugin = () => {
    setShowInstallPlugin(true);
  };

  const confirmInstallPlugin = async () => {
    if (!newPluginAddress.trim()) {
      alert('Введите адрес плагина');
      return;
    }
    if (!mnemonic.trim()) {
      alert('Введите seed фразу');
      return;
    }

    setLoading(true);
    try {
      console.log('➕ Установка плагина:', newPluginAddress);

      const boc = await createInstallPluginExternalMessage(
        mnemonic.trim(),
        address,
        newPluginAddress.trim()
      );

      const result = await sendExternalMessage(boc);

      alert('✅ Плагин успешно установлен!\n\nОбновите список через несколько секунд.');

      setShowInstallPlugin(false);
      setMnemonic('');
      setNewPluginAddress('');

      setTimeout(() => {
        fetchPlugins();
      }, 3000);

    } catch (err) {
      console.error('❌ Ошибка установки:', err);
      alert('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemovePlugin = async () => {
    if (!mnemonic.trim()) {
      alert('Введите seed фразу');
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Удаление плагина:', selectedPlugin.friendlyAddress);

      const boc = await createRemovePluginExternalMessage(
        mnemonic.trim(),
        address,
        selectedPlugin.friendlyAddress
      );

      const result = await sendExternalMessage(boc);

      alert('✅ Плагин успешно удален!\n\nОбновите список через несколько секунд.');

      setShowMnemonicInput(false);
      setMnemonic('');
      setSelectedPlugin(null);

      setTimeout(() => {
        fetchPlugins();
      }, 3000);

    } catch (err) {
      console.error('❌ Ошибка удаления:', err);
      alert('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="header">
        <div className="logo">
          <img src="user.jpg" alt="Avatar" className="logo-avatar" />
          <h1>{t.title}</h1>
        </div>
        <div className="lang-switcher">
          <button
            className={lang === 'ru' ? 'active' : ''}
            onClick={() => setLang('ru')}
          >
            RU
          </button>
          <button
            className={lang === 'en' ? 'active' : ''}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </div>

      <div className="content">
        <div className="test-section">
          <div className="test-card">
            <h2>{t.testParsing}</h2>

            <div className="input-group">
              <label>{t.walletAddress}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="UQC... или EQ..."
                disabled={loading}
              />
            </div>

            <div className="button-group">
              <button
                className="test-button"
                onClick={fetchPlugins}
                disabled={loading}
              >
                {loading ? `⏳ ${t.loading}` : `🔍 ${t.getPlugins}`}
              </button>

              <button
                className="install-button"
                onClick={handleInstallPlugin}
                disabled={loading}
              >
                ➕ {t.installPlugin}
              </button>
            </div>

            <div className="info-hint">
              💡 {t.consoleHint}
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
                <p>{t.noPlugins}</p>
                <span className="empty-hint">
                  {t.enterAddress}
                </span>
              </div>
            )}

            {!loading && !error && pluginList.length > 0 && (
              <div className="plugins-list">
                <h3>✅ {t.found} {pluginList.length}</h3>
                {pluginList.map((plugin, index) => (
                  <div key={plugin.id || index} className="plugin-item">
                    <div className="plugin-icon">🧩</div>
                    <div className="plugin-info">
                      <h4>{t.plugin} #{index + 1}</h4>
                      <div className="plugin-details">
                        <div className="plugin-field">
                          <label>{t.friendly}</label>
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
                          <label>{t.raw}</label>
                          <code className="plugin-address">{plugin.fullAddress}</code>
                        </div>
                        <div className="plugin-field">
                          <label>{t.workchain}</label>
                          <span>{plugin.workchain}</span>
                        </div>
                        <div className="plugin-field">
                          <label>{t.hash}</label>
                          <code style={{ fontSize: '0.75rem' }}>{plugin.addressHash}</code>
                        </div>
                      </div>
                    </div>
                    <button
                      className="remove-plugin-btn"
                      onClick={() => handleRemovePlugin(plugin)}
                      disabled={loading}
                      title="Удалить плагин"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для установки плагина */}
      {showInstallPlugin && (
        <div className="modal-overlay" onClick={() => setShowInstallPlugin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ {t.installTitle}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowInstallPlugin(false);
                  setMnemonic('');
                  setNewPluginAddress('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label>{t.pluginAddress}</label>
              <input
                type="text"
                className="mnemonic-input"
                placeholder="EQD... или 0:..."
                value={newPluginAddress}
                onChange={(e) => setNewPluginAddress(e.target.value)}
                disabled={loading}
              />

              <label style={{ marginTop: '1rem' }}>{t.seedPhrase}</label>
              <textarea
                className="mnemonic-input"
                placeholder="word1 word2 word3 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                disabled={loading}
                rows="3"
              />
              <div className="modal-info">
                <p>⚠️ {t.seedNotSaved}</p>
                <p>🔐 {t.opInstall}</p>
                <p>💰 {t.amount}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setShowInstallPlugin(false);
                  setMnemonic('');
                  setNewPluginAddress('');
                }}
                disabled={loading}
              >
                {t.cancel}
              </button>
              <button
                className="modal-btn confirm"
                onClick={confirmInstallPlugin}
                disabled={loading || !mnemonic.trim() || !newPluginAddress.trim()}
              >
                {loading ? t.installing : `➕ ${t.install}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для удаления плагина */}
      {showMnemonicInput && selectedPlugin && (
        <div className="modal-overlay" onClick={() => setShowMnemonicInput(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ {t.removeTitle}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowMnemonicInput(false);
                  setMnemonic('');
                  setSelectedPlugin(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                {t.plugin}: <code>{selectedPlugin.friendlyAddress}</code>
              </p>
              <label>{t.seedPhrase}</label>
              <textarea
                className="mnemonic-input"
                placeholder="word1 word2 word3 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                disabled={loading}
                rows="3"
              />
              <div className="modal-info">
                <p>⚠️ {t.seedNotSaved}</p>
                <p>🔐 {t.opRemove}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setShowMnemonicInput(false);
                  setMnemonic('');
                  setSelectedPlugin(null);
                }}
                disabled={loading}
              >
                {t.cancel}
              </button>
              <button
                className="modal-btn confirm"
                onClick={confirmRemovePlugin}
                disabled={loading || !mnemonic.trim()}
              >
                {loading ? t.removing : `🗑️ ${t.remove}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>{t.madeBy} <a href="https://t.me/fiscaldev" target="_blank" rel="noopener noreferrer">@fiscaldev</a></p>
      </footer>
    </div>
  );
};
