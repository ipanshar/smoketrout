# 🐟 Smoketrout

Система управления производством копчёной рыбы.

## Структура проекта

```
smoketrout/
├── backend/          # Laravel 11 API
├── frontend/         # React + Vite + TypeScript
└── mobile/           # React Native
```

## Требования

### Backend
- PHP 8.2+
- Composer
- SQLite / MySQL / PostgreSQL

### Frontend
- Node.js 18+
- npm или yarn

### Mobile
- Node.js 18+
- Android Studio / Xcode
- React Native CLI

## Установка

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install

# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## Конфигурация

### Backend (.env)

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=sqlite
# или для MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=smoketrout
# DB_USERNAME=root
# DB_PASSWORD=

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

### Mobile (.env)

```env
API_URL=http://10.0.2.2:8000/api  # Android Emulator
# API_URL=http://localhost:8000/api  # iOS Simulator
```

## Деплой

### Production Build (Frontend)

```bash
cd frontend
npm run build
# Загрузите содержимое dist/ на сервер
```

### Production (Backend)

```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

## Функционал

- 👤 Управление пользователями и ролями
- 📦 Справочники (товары, склады, кассы, контрагенты)
- 💰 Учёт движения денег и товаров
- 🏭 Производство по рецептам
- 💵 Учёт дивидендов и зарплат
- 📊 Дашборд с графиками

## Лицензия

Приватный проект. Все права защищены.
