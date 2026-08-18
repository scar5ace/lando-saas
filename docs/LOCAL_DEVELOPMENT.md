# Локальный запуск Lando

Самый простой способ запуска — Docker Compose. Он поднимает PostgreSQL, применяет миграции, запускает Lando, Caddy и ежедневное резервное копирование. На компьютере, где подготовлен этот проект, Docker пока не установлен, поэтому контейнерный запуск нужно выполнить после установки Docker Desktop.

## Вариант A: Docker Desktop (рекомендуется)

### 1. Установите Docker Desktop

1. Откройте [официальную инструкцию Docker Desktop для Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Установите Docker Desktop с WSL 2, если установщик предлагает этот вариант.
3. Перезагрузите Windows, если установщик попросит.
4. Запустите Docker Desktop и дождитесь статуса `Engine running`.

Секреты из `.env` нельзя отправлять в чат, публиковать на скриншотах или добавлять в Git.

### 2. Подготовьте конфигурацию

Откройте PowerShell в папке проекта:

```powershell
cd "C:\Users\sunri\OneDrive\Desktop\lando_space"
```

Если файла `.env` ещё нет, создайте его из примера. Эта команда не перезапишет существующий файл:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Сгенерируйте два разных случайных значения:

```powershell
& "C:\Program Files\nodejs\node.exe" -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
& "C:\Program Files\nodejs\node.exe" -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Откройте `.env` обычным Блокнотом и вставьте:

- первое значение после `POSTGRES_PASSWORD=`;
- второе значение после `AUTH_SECRET=`.

Для локального запуска оставьте эти параметры без изменений:

```dotenv
NODE_ENV=development
LANDO_RUNTIME_ENV=development
LANDO_IMAGE_TARGET=development
APP_URL=http://localhost:3000
PLATFORM_ROOT_DOMAIN=localhost
LLM_PROVIDER=mock
EMAIL_PROVIDER=console
CADDY_SITE_ADDRESS=http://localhost
LANDO_HTTP_PORT=3000
```

`LANDO_IMAGE_TARGET=development` запускает Next.js dev server, а `LANDO_RUNTIME_ENV=development` разрешает локальный `console`-провайдер писем. Production standalone image принудительно работает с `NODE_ENV=production`, поэтому смешать эти режимы нельзя.

### 3. Запустите сервисы

Сначала проверьте конфигурацию, затем соберите и запустите контейнеры:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Одноразовый контейнер `migrate` автоматически выполняет `prisma migrate deploy`. Приложение стартует только после успешной миграции и готовности PostgreSQL.

Откройте в браузере:

- приложение: <http://localhost:3000>;
- readiness базы и приложения: <http://localhost:3000/api/health/ready>;
- liveness процесса: <http://localhost:3000/api/health/live>.

### 4. Добавьте демонстрационные данные

```powershell
docker compose run --rm migrate npm run db:seed
```

Seed можно повторять: он обновляет одну и ту же демо-учётную запись, проект, страницу и версии без создания дублей. Повторный запуск заменяет ручные изменения именно в демо-проекте и завершает его активные сессии. Он намеренно завершается ошибкой вне `development`, при внешнем AI или реальном email-провайдере.

Данные только для локальной разработки:

```text
Email: demo@lando.test
Пароль: Demo-Lando-2026!
Публичная демо-страница: http://localhost:3000/s/demo-kondicionery-saratov
```

Этот пароль предсказуем и категорически запрещён в production. Seed устанавливает пароль и подтверждает email через серверные API Better Auth; собственная реализация хеширования не используется.

### 5. Логи и локальные письма

```powershell
docker compose logs -f app
```

При `EMAIL_PROVIDER=console` письмо не отправляется. Одноразовая ссылка подтверждения или сброса выводится только в локальный лог. Не публикуйте такую ссылку.

Для выхода из просмотра логов нажмите `Ctrl+C`. Это не останавливает сервисы.

### 6. Остановка

```powershell
docker compose down
```

База, загрузки и данные Caddy сохраняются в Docker volumes. Не выполняйте `docker compose down -v`, если не хотите безвозвратно удалить локальную базу и загруженные файлы.

## Вариант B: Node.js и локальный PostgreSQL

Нужны Node.js `20.19+` и PostgreSQL. Затем:

```powershell
cd "C:\Users\sunri\OneDrive\Desktop\lando_space"
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

В этом варианте `DATABASE_URL` должен указывать на PostgreSQL по адресу `localhost`. Если PostgreSQL запущен через Compose, контейнер базы намеренно не опубликован наружу; используйте полностью контейнерный вариант либо отдельно добавьте безопасный loopback-порт для базы.

## Проверки перед изменениями

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Частые проблемы

### Команда `docker` не найдена

Docker Desktop не установлен или ещё не запущен. Выполните шаг 1 и заново откройте PowerShell.

### Порт 3000 занят

Измените в `.env` только локальный порт, например:

```dotenv
LANDO_HTTP_PORT=3001
APP_URL=http://localhost:3001
```

После этого выполните `docker compose up -d` и открывайте <http://localhost:3001>.

### `Set POSTGRES_PASSWORD in .env`

Поле `POSTGRES_PASSWORD=` пустое. Сгенерируйте значение по шагу 2 и вставьте его без кавычек и пробелов.

### Сервис `app` не становится healthy

```powershell
docker compose ps
docker compose logs --tail 200 migrate postgres app
```

Readiness health-check проверяет и приложение, и соединение с PostgreSQL. Скопируйте текст ошибки без содержимого `.env`.

### Нужно начать с чистой локальной базы

Удаление volume необратимо. Сначала сохраните backup по [инструкции](./BACKUP_RESTORE.md). Только после осознанного подтверждения можно остановить Compose и удалить volumes.

## Что создаётся автоматически

- `./backups` — ежедневные PostgreSQL dump-файлы с локальным сроком хранения 7 дней;
- Docker volume `postgres_data` — рабочая база;
- Docker volume `uploads_data` — локальные загрузки;
- Docker volumes `caddy_data` и `caddy_config` — состояние Caddy.

Каталог `./backups` не входит в Git. Для production копии обязательно должны уходить на другой сервер или в защищённое объектное хранилище.
