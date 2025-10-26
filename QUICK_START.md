# 🚀 Быстрый старт

## Перед пушем на GitHub:

### ✏️ Замените YOUR_GITHUB_USERNAME на ваш GitHub username

**Файл 1: `tonconnect-manifest.json`**
```json
{
    "url": "https://YOUR_GITHUB_USERNAME.github.io/ExtensionManager/",
    "iconUrl": "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/ExtensionManager/main/mod.logo.png"
}
```

**Файл 2: `src/App.jsx`**
```jsx
<TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/ExtensionManager/main/tonconnect-manifest.json">
```

---

## 📤 Пуш на GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ExtensionManager.git
git push -u origin main
```

---

## ⚙️ Включение GitHub Pages:

1. Откройте репозиторий на GitHub
2. **Settings** → **Pages**
3. Source: выберите **GitHub Actions**
4. Сохраните

Готово! 🎉

После push GitHub Actions автоматически соберет и задеплоит приложение.

Ваш сайт будет доступен по адресу:
```
https://YOUR_GITHUB_USERNAME.github.io/ExtensionManager/
```

---

## 📝 После деплоя:

Дайте мне ссылку на ваш GitHub репозиторий, и я помогу с дальнейшей настройкой!

---

## 🔧 Если нужно изменить название репозитория:

Если вы назвали репозиторий по-другому (не ExtensionManager), обновите:
1. `vite.config.js` → `base: '/YOUR_REPO_NAME/'`
2. `tonconnect-manifest.json` → обновите URLs
3. `src/App.jsx` → обновите manifestUrl

