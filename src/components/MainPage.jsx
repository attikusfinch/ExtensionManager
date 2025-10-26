import { useState } from 'react';
import { TonClient, Address } from '@ton/ton';
import { createInstallPluginExternalMessage, createRemovePluginExternalMessage, sendExternalMessage } from '../utils/externalMessage';
import './MainPage.css';

export const MainPage = () => {
  const [address, setAddress] = useState('UQCQKEJl-yQU6Ly2JN0OGiUCM3wdL20KrwOy6bbH3Pya5WhP');
  const [pluginList, setPluginList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonicInput, setShowMnemonicInput] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [showInstallPlugin, setShowInstallPlugin] = useState(false);
  const [newPluginAddress, setNewPluginAddress] = useState('');

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

            <div className="button-group">
              <button
                className="test-button"
                onClick={fetchPlugins}
                disabled={loading}
              >
                {loading ? '⏳ Загрузка...' : '🔍 Получить список плагинов'}
              </button>

              <button
                className="install-button"
                onClick={handleInstallPlugin}
                disabled={loading}
              >
                ➕ Установить плагин
              </button>
            </div>

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
              <h3>➕ Установка плагина</h3>
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
              <label>Адрес плагина:</label>
              <input
                type="text"
                className="mnemonic-input"
                placeholder="EQD... или 0:..."
                value={newPluginAddress}
                onChange={(e) => setNewPluginAddress(e.target.value)}
                disabled={loading}
              />

              <label style={{ marginTop: '1rem' }}>Seed фраза (24 слова):</label>
              <textarea
                className="mnemonic-input"
                placeholder="word1 word2 word3 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                disabled={loading}
                rows="3"
              />
              <div className="modal-info">
                <p>⚠️ Seed фраза не сохраняется</p>
                <p>🔐 External message с op=2 (install plugin)</p>
                <p>💰 Amount: 0.05 TON на плагин</p>
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
                Отмена
              </button>
              <button
                className="modal-btn confirm"
                onClick={confirmInstallPlugin}
                disabled={loading || !mnemonic.trim() || !newPluginAddress.trim()}
              >
                {loading ? 'Установка...' : '➕ Установить'}
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
              <h3>🗑️ Удаление плагина</h3>
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
                Плагин: <code>{selectedPlugin.friendlyAddress}</code>
              </p>
              <label>Seed фраза (24 слова):</label>
              <textarea
                className="mnemonic-input"
                placeholder="word1 word2 word3 ..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                disabled={loading}
                rows="3"
              />
              <div className="modal-info">
                <p>⚠️ Seed фраза не сохраняется и используется только для подписи</p>
                <p>🔐 Будет создано и отправлено external message с op=3</p>
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
                Отмена
              </button>
              <button
                className="modal-btn confirm"
                onClick={confirmRemovePlugin}
                disabled={loading || !mnemonic.trim()}
              >
                {loading ? 'Удаление...' : '🗑️ Удалить плагин'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Сделано <a href="https://t.me/fiscaldev" target="_blank" rel="noopener noreferrer">@fiscaldev</a></p>
      </footer>
    </div>
  );
};
