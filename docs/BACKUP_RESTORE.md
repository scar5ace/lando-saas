# Backup и восстановление PostgreSQL

Рабочая база и резервная копия — разные вещи. Docker volume `postgres_data` защищает от пересоздания контейнера, но не от ошибки оператора, повреждения диска, кражи сервера или неудачной миграции.

## Автоматические backup

Сервис `backup` в `compose.yaml`:

- делает первый compressed custom-format dump после запуска;
- повторяет backup каждые 86 400 секунд (раз в сутки);
- сначала пишет файл `.partial`, затем атомарно переименовывает его;
- хранит файлы в `./backups` с правами, ограниченными через `umask 077`;
- удаляет локальные dump-файлы старше 7 дней;
- автоматически перезапускается после ошибки.

Интервал и срок хранения задаются в `.env`:

```dotenv
BACKUP_INTERVAL_SECONDS=86400
BACKUP_RETENTION_DAYS=7
```

Проверка:

```powershell
docker compose ps backup
docker compose logs --tail 100 backup
Get-ChildItem .\backups\lando-*.dump
```

Чтобы запросить внеплановый backup, перезапустите только backup-сервис. После старта он сразу создаёт dump:

```powershell
docker compose restart backup
docker compose logs --tail 20 backup
```

Успех подтверждается строкой `PostgreSQL backup completed`. Одного наличия файла недостаточно: регулярно выполняйте проверочное восстановление.

## Обязательное off-site хранение

`./backups` находится на том же сервере, что и база. Это оперативная копия, но не полноценная защита от потери сервера.

Минимальная политика:

- ежедневно копировать новый dump на другой сервер или в объектное хранилище;
- шифровать передачу и хранение;
- использовать отдельные credentials только на запись;
- хранить минимум 7 ежедневных и 4 еженедельных копии;
- включить versioning/immutability, если провайдер поддерживает;
- раз в месяц восстанавливать копию в отдельную тестовую базу;
- документировать дату, размер и результат проверки.

Off-site выгрузка зависит от выбранного провайдера и в текущем репозитории не автоматизирована. До её настройки production-запуск небезопасен.

## Проверка dump без изменения рабочей базы

Выберите конкретный файл и скопируйте его в контейнер PostgreSQL:

```powershell
$backupFile = ".\backups\lando-20260726T120000Z.dump"
docker compose cp $backupFile postgres:/tmp/lando-restore-check.dump
docker compose exec postgres pg_restore --list /tmp/lando-restore-check.dump
```

Замените имя в первой строке на реальный файл. `pg_restore --list` должен завершиться без ошибки и показать каталог объектов.

Для полноценной проверки восстановите его в отдельную базу:

```powershell
docker compose exec postgres createdb -U lando lando_restore_check
docker compose exec postgres pg_restore --exit-on-error --no-owner --no-privileges -U lando -d lando_restore_check /tmp/lando-restore-check.dump
'SELECT COUNT(*) AS users FROM "user";' | docker compose exec -T postgres psql -U lando -d lando_restore_check
docker compose exec postgres psql -U lando -d lando_restore_check -c 'SELECT COUNT(*) AS projects FROM project;'
```

Если `lando_restore_check` уже существует, не удаляйте её вслепую: сначала выясните, кто её создал и нужна ли она. Для очистки тестовой базы привлеките администратора.

## Восстановление рабочей базы

Это разрушительная операция: текущее содержимое схемы будет заменено содержимым backup. Выполняйте её только при подтверждённом инциденте и сохранённом аварийном dump.

### 1. Объявите режим обслуживания

Остановите запись данных и ежедневный backup, но оставьте PostgreSQL запущенным:

```powershell
docker compose stop caddy app backup
docker compose ps
```

### 2. Сохраните аварийную копию текущего состояния

```powershell
docker compose exec postgres pg_dump -U lando -d lando -Fc --no-owner --no-privileges -f /tmp/lando-before-restore.dump
docker compose cp postgres:/tmp/lando-before-restore.dump .\backups\lando-before-restore.dump
```

Проверьте, что `lando-before-restore.dump` появился и имеет ненулевой размер.

### 3. Проверьте выбранный backup

```powershell
$backupFile = ".\backups\lando-20260726T120000Z.dump"
docker compose cp $backupFile postgres:/tmp/lando-restore.dump
docker compose exec postgres pg_restore --list /tmp/lando-restore.dump
```

### 4. Восстановите данные

Следующие команды принудительно закрывают оставшиеся соединения, полностью пересоздают рабочую базу и восстанавливают dump. В отличие от `pg_restore --clean`, пересоздание базы гарантирует, что объекты из более новой схемы не переживут откат:

```powershell
docker compose exec postgres dropdb --force --if-exists -U lando lando
docker compose exec postgres createdb -U lando -O lando lando
docker compose exec postgres pg_restore --exit-on-error --no-owner --no-privileges -U lando -d lando /tmp/lando-restore.dump
```

После первой команды прежняя рабочая база уже удалена. Не закрывайте PowerShell и не перезапускайте PostgreSQL до завершения восстановления. Если `pg_restore` завершился ошибкой, не запускайте приложение: исправьте причину и повторите восстановление из проверенного либо аварийного dump в снова созданную пустую базу.

### 5. Примените более новые миграции и проверьте health

```powershell
docker compose run --rm migrate
docker compose start app
docker compose ps
'SELECT COUNT(*) AS users FROM "user";' | docker compose exec -T postgres psql -U lando -d lando
docker compose exec postgres psql -U lando -d lando -c 'SELECT COUNT(*) AS projects FROM project;'
```

После проверки приложения:

```powershell
docker compose start backup caddy
docker compose logs --tail 100 app caddy backup
```

### 6. После инцидента

- не удаляйте `lando-before-restore.dump`, пока данные не подтверждены владельцем продукта;
- сравните время backup с моментом инцидента и оцените потерянные записи;
- смените скомпрометированные секреты, если причина связана с доступом;
- зафиксируйте причину, действия и результат;
- выполните новую off-site копию.

## Что backup не содержит

PostgreSQL dump не включает:

- файлы из `uploads_data`;
- сертификаты и состояние Caddy;
- `.env` и секреты;
- исходный код и Docker images.

Для production нужна отдельная зашифрованная копия uploads и конфигурации. Секреты храните в password manager или secret manager, а не внутри database dump.
