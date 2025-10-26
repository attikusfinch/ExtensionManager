# Инструкция по деплою на GitHub Pages

## 1️⃣ Подготовка

Замените `YOUR_GITHUB_USERNAME` на ваш GitHub username в следующих файлах:
- `tonconnect-manifest.json` (строки 2 и 4)
- `src/App.jsx` (строка 7)

Например, если ваш username `johndoe`, замените на:
```
YOUR_GITHUB_USERNAME → johndoe
```

## 2️⃣ Создание репозитория на GitHub

1. Создайте новый репозиторий на GitHub с именем `ExtensionManager`
2. Инициализируйте git в проекте:
```bash
git init
git add .
git commit -m "Initial commit: Extension Manager with TON Connect"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ExtensionManager.git
git push -u origin main
```

## 3️⃣ Настройка GitHub Actions для деплоя

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 4️⃣ Включение GitHub Pages

1. Перейдите в Settings репозитория на GitHub
2. В разделе "Pages" выберите:
   - Source: **GitHub Actions**
3. Сохраните настройки

## 5️⃣ Обновление vite.config.js

Добавьте `base` в конфигурацию для правильных путей:

```javascript
export default defineConfig({
  base: '/ExtensionManager/',
  // ... остальная конфигурация
})
```

## 6️⃣ Деплой

После push в main ветку:
```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push
```

GitHub Actions автоматически соберет и задеплоит приложение.

Ваше приложение будет доступно по адресу:
```
https://YOUR_GITHUB_USERNAME.github.io/ExtensionManager/
```

## 🔧 Альтернатива: Деплой на Vercel (проще)

1. Зарегистрируйтесь на [Vercel](https://vercel.com)
2. Подключите GitHub репозиторий
3. Vercel автоматически определит Vite проект и задеплоит
4. Обновите `tonconnect-manifest.json` с полученным URL от Vercel
5. Не забудьте обновить `manifestUrl` в `src/App.jsx`

## ✅ Проверка

После деплоя:
1. Откройте ваше приложение
2. Подключите кошелек TON
3. Проверьте что get-метод `get_plugin_list` вызывается

