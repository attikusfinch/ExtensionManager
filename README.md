# Plugin Manager - TON

Менеджер плагинов для TON кошельков v4. Просмотр, установка и удаление плагинов через get-методы и external messages.

## 🚀 Возможности

- ✅ Интеграция TON Connect 2.0
- 🔍 Автоматическое определение версии кошелька (v4 с плагинами)
- 🔌 Получение списка плагинов через get-метод `get_plugin_list`
- ➕ Установка новых плагинов через UI
- 🗑️ Удаление установленных плагинов
- 🎨 Современный и красивый UI
- 📱 Адаптивный дизайн
- ⚡ Быстрая разработка с Vite
- 🔐 Безопасное подключение кошелька
- 💼 Отображение информации о подключенном кошельке
- 📋 Копирование адресов в буфер обмена
- 🔄 Автоматическая загрузка плагинов при подключении

## 📦 Установка

1. Установите зависимости:
```bash
npm install
```

## 🏃 Запуск

Запустите приложение в режиме разработки:
```bash
npm run dev
```

Приложение откроется автоматически по адресу [http://localhost:3000](http://localhost:3000)

## 🏗️ Сборка для продакшена

Создайте оптимизированную сборку:
```bash
npm run build
```

Просмотрите production сборку:
```bash
npm run preview
```

## 📖 Использование

### Подключение кошелька
1. Нажмите кнопку "Connect Wallet" в правом верхнем углу
2. Выберите ваш TON кошелек (Tonkeeper, OpenMask и т.д.)
3. Подтвердите подключение в кошельке
4. Приложение автоматически определит версию кошелька и загрузит список плагинов

### Управление плагинами

**Деплой нового плагина (op = 1):**
1. Нажмите кнопку "🚀 Деплой"
2. Подтвердите деплой предустановленного плагина
3. Подтвердите транзакцию в кошельке (~0.1 TON)
4. Новый плагин будет задеплоен и автоматически установлен
5. Адрес нового плагина отобразится в уведомлении

**Установка существующего плагина (op = 2):**
1. Нажмите кнопку "➕ Добавить"
2. Введите адрес плагина (friendly или raw формат)
3. Подтвердите транзакцию в кошельке (~0.05 TON)
4. Плагин будет установлен

**Удаление плагина (op = 3):**
1. Нажмите кнопку "🗑️" рядом с плагином
2. Подтвердите удаление
3. Подтвердите транзакцию в кошельке (~0.01 TON)
4. Плагин будет удален

### Поддерживаемые кошельки
- ✅ Wallet v4 с поддержкой плагинов
- ❌ Другие версии (v3, v4r2 без плагинов) - только просмотр адреса

## 🔧 Технические детали

Приложение использует библиотеку `@ton/ton` для взаимодействия с блокчейном TON:
- Подключение к mainnet через TonCenter API
- Вызов get-метода `get_plugin_list` на адресе подключенного кошелька
- Парсинг результата и отображение списка плагинов
- Создание транзакций для установки/удаления/деплоя плагинов

### Операции с плагинами

**op = 1 (Deploy and Install):**
```javascript
// Структура external message:
op(8) + workchain(8) + balance(coins) + state_init(ref) + body(ref)
```
- Деплоит новый контракт плагина
- Автоматически добавляет его в список установленных
- Требует state_init (code + data) и body для плагина

**op = 2 (Install):**
```javascript
// Структура external message:
op(8) + wc_n_address(264) + amount(coins) + query_id(64)
```
- Устанавливает существующий плагин
- Плагин должен быть уже задеплоен

**op = 3 (Remove):**
```javascript
// Структура external message:
op(8) + wc_n_address(264) + amount(coins) + query_id(64)
```
- Удаляет плагин из списка
- Отправляет уведомление плагину

### Get-метод get_plugin_list

Возвращает tuple с парами (workchain, address_hash):
```javascript
tuple get_plugin_list() method_id {
  var list = null();
  // ... код парсинга словаря плагинов
  return list; // [(wc, addr), (wc, addr), ...]
}
```

## 🛠️ Технологии

- **React 18** - UI библиотека
- **Vite** - сборщик и dev-сервер
- **@tonconnect/ui-react** - TON Connect интеграция
- **@ton/ton** - работа с TON blockchain
- **@ton/core** - базовые примитивы TON
- **CSS3** - стилизация с градиентами и анимациями

## 📝 Настройка манифеста

По умолчанию используется тестовый манифест. Для продакшена создайте свой `tonconnect-manifest.json`:

```json
{
  "url": "https://your-app-url.com",
  "name": "Your App Name",
  "iconUrl": "https://your-app-url.com/icon.png"
}
```

И обновите путь к манифесту в `src/App.jsx`:

```javascript
<TonConnectUIProvider manifestUrl="https://your-app-url.com/tonconnect-manifest.json">
```

## 🎨 Кастомизация

- Измените цветовую схему в `src/components/MainPage.css`
- Добавьте новые функции в `src/components/MainPage.jsx`
- Настройте логотип и название в `src/components/MainPage.jsx`

## 🚀 Деплой на GitHub Pages

**Перед деплоем замените `YOUR_GITHUB_USERNAME` на ваш GitHub username в:**
- `tonconnect-manifest.json`
- `src/App.jsx`

Подробная инструкция в файле [QUICK_START.md](QUICK_START.md)

### Быстрый деплой:

```bash
# 1. Замените YOUR_GITHUB_USERNAME в файлах выше
# 2. Инициализируйте git и запушьте на GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ExtensionManager.git
git push -u origin main
```

3. Включите GitHub Pages в настройках репозитория (Settings → Pages → Source: GitHub Actions)

После деплоя приложение будет доступно по адресу:
```
https://YOUR_GITHUB_USERNAME.github.io/ExtensionManager/
```

## 📄 Лицензия

MIT

## 🤝 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.

