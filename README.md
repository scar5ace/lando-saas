# Lando

Lando — русскоязычный B2C SaaS для создания и публикации одностраничных сайтов по текстовому описанию. Репозиторий содержит Next.js-приложение, PostgreSQL-схему и миграции Prisma, Better Auth, интеграцию внешней языковой модели с безопасным локальным fallback, визуальный редактор, публичный рендеринг, Docker Compose и эксплуатационную документацию.

## О проекте для портфолио

Lando демонстрирует полный путь создания SaaS-продукта: от продуктовой спецификации и проектирования схемы данных до AI-генерации, редактирования, публикации, тестирования и локальной инфраструктуры.

Ключевые инженерные решения:

- строгий `PageSchema`: AI не может вставить произвольный HTML или JavaScript;
- компактный AI-бриф преобразуется приложением в валидную структуру страницы;
- сменные провайдеры AI, email, биллинга и хранения;
- транзакционное создание проектов, версии страниц и журнал аудита;
- optimistic concurrency для защиты черновиков от перезаписи;
- Docker Compose с PostgreSQL, миграционным gate, health checks, Caddy и резервным копированием;
- unit, integration и Playwright smoke-тесты;
- отдельная документация по архитектуре, решениям, развёртыванию и восстановлению.

```text
Промпт пользователя
        ↓
AI-провайдер → безопасный содержательный бриф
        ↓
Валидация и построение PageSchema
        ↓
Черновик → визуальный редактор → опубликованный snapshot
```

Текущий статус: локальный MVP для демонстрации и закрытого тестирования. Это не обещание готовности к публичной production-эксплуатации; известные ограничения перечислены в [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).

> Публичный production-запуск заблокирован, пока не реализованы SMTP и другие провайдеры из [списка ограничений](docs/KNOWN_LIMITATIONS.md).

## Быстрый локальный запуск

На Windows рекомендуется Docker Desktop. Сначала создайте `.env` из `.env.example`, заполните случайные `POSTGRES_PASSWORD` и `AUTH_SECRET`, затем выполните:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose run --rm migrate npm run db:seed
```

Откройте:

- Lando: <http://localhost:3000>;
- опубликованный demo-сайт: <http://localhost:3000/s/demo-kondicionery-saratov>;
- readiness: <http://localhost:3000/api/health/ready>;
- liveness: <http://localhost:3000/api/health/live>.

Демонстрационный вход только для локальной разработки:

```text
Email: demo@lando.test
Пароль: Demo-Lando-2026!
```

Этот пароль предсказуем и запрещён в production. Seed сам блокируется вне `NODE_ENV=development`, а также при внешнем AI или реальном email-провайдере.

Подробная пошаговая инструкция для человека без опыта программирования: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

## Основные команды

```text
npm run dev          локальный Next.js dev server
npm run build        production build
npm run start        запуск собранного приложения
npm run typecheck    проверка TypeScript
npm run lint         ESLint
npm test             unit/integration tests
npm run test:e2e     Playwright smoke tests
npm run db:generate  генерация Prisma Client
npm run db:migrate   development-миграция
npm run db:deploy    применение готовых миграций
npm run db:seed      идемпотентные локальные demo-данные
```

Обычная команда `npm run test:e2e` запускает публичный smoke-тест. Полный сценарий входа, редактирования и публикации требует запущенной БД с demo seed:

```powershell
$env:E2E_FULL = "1"
npm run test:e2e -- tests/e2e/vertical-slice.spec.ts
```

## Состав MVP

- регистрация, вход, подтверждение email и сброс пароля через Better Auth;
- PostgreSQL-модель данных и начальная миграция Prisma;
- создание проекта из prompt через заменяемый `LLMProvider` (внешний API или локальный mock);
- безопасный `PageSchema` без произвольного HTML и JavaScript;
- редактор блоков и сохранение ревизий;
- публикация immutable snapshot по адресу `/s/{slug}`;
- mock-провайдеры для AI, email и billing в локальном окружении;
- health endpoints, Caddy reverse proxy, миграционный gate и ограничение container logs;
- ежедневный PostgreSQL dump с локальным retention 7 дней;
- demo-пользователь и опубликованный demo-проект.

## Структура

```text
src/app/                 Next.js routes и UI
src/components/          компоненты и renderer PageSchema
src/features/            бизнес-возможности и providers
src/lib/                 auth, db, env, security, validation
src/server/              серверные use cases
prisma/                  schema, migrations, seed
tests/                   Vitest и Playwright tests
docs/                    продуктовая и эксплуатационная документация
Dockerfile               multi-stage app/tools image
compose.yaml             PostgreSQL, migrate, app, backup, Caddy
Caddyfile                reverse proxy и readiness probe
```

## Документация

- [Product spec](docs/PRODUCT_SPEC.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [План реализации](docs/IMPLEMENTATION_PLAN.md)
- [Архитектурные решения](docs/DECISIONS.md)
- [Локальная разработка](docs/LOCAL_DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Backup и restore](docs/BACKUP_RESTORE.md)
- [Известные ограничения и следующие шаги](docs/KNOWN_LIMITATIONS.md)

## Безопасность конфигурации

- настоящие ключи хранятся только в `.env` или secret manager;
- `.env` не входит в Git и не должен отправляться в чат;
- `EMAIL_PROVIDER=console` разрешён только локально;
- demo seed запрещён в production;
- PostgreSQL и app не публикуются наружу в Compose — трафик принимает Caddy;
- Caddy access logs отключены, пока не реализована проверенная redaction auth-токенов;
- перед production-релизом обязательны off-site backup и тестовое восстановление.

Если команда завершается ошибкой, не применяйте `audit fix --force`, `prisma migrate reset`, `docker compose down -v` или ручное удаление данных. Сначала сохраните текст ошибки без содержимого `.env` и используйте соответствующий раздел документации.
