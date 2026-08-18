# Развёртывание Lando

Текущий Compose пригоден для локального запуска и закрытого staging. Публичный production-запуск пока заблокирован отсутствием реализованного SMTP-адаптера: конфигурация `smtp` валидируется, но отправка писем ещё не реализована. Без неё нельзя надёжно подтверждать email и восстанавливать пароль. Остальные release-блокеры перечислены в [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md).

Ниже описана целевая процедура для Ubuntu LTS после устранения release-блокеров.

## 1. Сервер и сеть

Минимальная конфигурация:

- Ubuntu LTS;
- 2 vCPU, 4 ГБ RAM, 50 ГБ NVMe;
- Docker Engine и Compose plugin;
- домен с `A`/`AAAA`-записью на IP сервера;
- открытые входящие порты `80/tcp`, `443/tcp`, `443/udp`;
- SSH только по ключам и только с доверенных адресов, если это возможно.

PostgreSQL и порт приложения не публикуются наружу. Единственная публичная точка входа — Caddy.

## 2. Production-конфигурация

Скопируйте `.env.example` в `.env` на сервере и задайте уникальные секреты. Права файла:

```bash
chmod 600 .env
```

Обязательная основа:

```dotenv
NODE_ENV=production
LANDO_RUNTIME_ENV=production
LANDO_IMAGE_TARGET=runner
APP_NAME=Lando
APP_URL=https://lando.example.ru
PLATFORM_ROOT_DOMAIN=lando.example.ru

POSTGRES_PASSWORD=<отдельный длинный случайный пароль>
AUTH_SECRET=<минимум 32 случайных символа>

CADDY_SITE_ADDRESS=lando.example.ru
LANDO_HTTP_PORT=80
LANDO_HTTPS_PORT=443

EMAIL_PROVIDER=smtp
SMTP_HOST=<smtp-хост>
SMTP_PORT=587
SMTP_USER=<логин>
SMTP_PASSWORD=<пароль>
EMAIL_FROM=no-reply@lando.example.ru
```

Production требует одновременно `LANDO_IMAGE_TARGET=runner`, `LANDO_RUNTIME_ENV=production`, HTTPS и рабочий SMTP. `runner` использует оптимизированный Next.js standalone build и принудительно работает в production mode. Не пытайтесь обходить запрет `EMAIL_PROVIDER=console`.

До реализации соответствующих провайдеров оставьте `LLM_PROVIDER=mock`, `STORAGE_PROVIDER=local` и `BILLING_PROVIDER=mock` только для staging. Это не полноценная production-конфигурация продукта.

Сгенерировать секреты на Linux можно так:

```bash
openssl rand -hex 24
openssl rand -base64 48
```

Не используйте один секрет для базы, Better Auth, SMTP и других интеграций.

## 3. Предварительная проверка

```bash
docker compose config --quiet
docker compose build app migrate
```

Команда `config --quiet` проверяет Compose без печати развёрнутой конфигурации и секретов в терминал. Публичные `APP_NAME`, `APP_URL` и `PLATFORM_ROOT_DOMAIN` передаются в production build как non-secret build arguments, потому что Next.js встраивает metadata и robots в статические файлы. Server-only значения при сборке остаются фиктивными; реальные секреты передаются только во время запуска. После смены публичного URL приложение обязательно нужно пересобрать.

## 4. Backup, миграция и запуск

Перед каждым обновлением создайте и выгрузите проверяемую резервную копию по [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).

Затем:

```bash
docker compose up -d postgres
docker compose up -d app backup caddy
```

Dependency gate сам запускает одноразовый service `migrate` перед зависимыми сервисами. Используется `prisma migrate deploy`: команда применяет только подготовленные миграции и не выполняет опасный development reset. Seed в production заблокирован и запускаться не должен.

## 5. Проверка запуска

```bash
docker compose ps
```

Caddy автоматически получает и обновляет TLS-сертификат, когда публичный DNS уже указывает на сервер и порты 80/443 доступны. Официальное описание: [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https).

Проверьте:

```bash
curl --fail --show-error https://lando.example.ru/api/health/ready
docker compose logs --tail 200 migrate app caddy backup
```

Ожидаемый health-ответ содержит `"status":"ok"` и `"database":"ok"`.

## 6. После запуска

- зарегистрируйте отдельного production-пользователя; demo seed не используйте;
- проверьте регистрацию, подтверждение email, вход и восстановление пароля;
- проверьте создание, редактирование и публикацию проекта;
- проверьте backup и тестовое восстановление;
- настройте внешнее наблюдение за HTTPS, `/api/health/live` и `/api/health/ready`;
- настройте отправку `./backups` в зашифрованное off-site хранилище;
- настройте оповещение о рестартах контейнеров, ошибках backup и заполнении диска.

Docker ограничивает локальные container logs пятью файлами по 10 МБ на сервис. HTTP access logs Caddy пока отключены, чтобы случайно не сохранить Better Auth URL с одноразовыми секретами. Перед их включением нужна проверенная path/query redaction. Текущие логи не заменяют централизованный безопасный сбор и алерты.

## 7. Обновление версии

Безопасный порядок:

1. Получить новый проверенный исходный код или image с неизменяемым тегом.
2. Запустить тесты и сборку в CI.
3. Создать off-site backup.
4. Собрать новые контейнеры.
5. Применить миграции отдельным `migrate`-контейнером.
6. Перезапустить `app` и `caddy`.
7. Проверить health-check и основные сценарии.

```bash
docker compose build app migrate
docker compose up -d app caddy
```

`compose.yaml` содержит dependency gate: `app` дождётся успешного завершения одноразового service `migrate`. Не запускайте перед этим отдельный `docker compose run migrate`, иначе идемпотентная миграция будет вызвана дважды.

## 8. Откат

Приложение можно откатить на предыдущий image только если схема базы с ним совместима. Prisma migration автоматически назад не откатывается.

Если миграция несовместима:

1. остановите публичный трафик и запись данных;
2. сохраните аварийный dump текущей базы;
3. восстановите последний подтверждённый backup;
4. запустите предыдущую версию приложения;
5. проведите разбор причины до повторного релиза.

Не применяйте `prisma migrate reset`, `docker compose down -v` или ручное удаление таблиц на production.

## 9. Ссылки на первичную документацию

- [Prisma: `migrate deploy`](https://docs.prisma.io/docs/cli/migrate/deploy)
- [Docker Compose: порядок запуска и health conditions](https://docs.docker.com/compose/how-tos/startup-order/)
- [Caddy: reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Next.js: Docker deployment](https://nextjs.org/docs/app/getting-started/deploying#docker)
