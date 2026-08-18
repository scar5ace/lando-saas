# Lando — план реализации

План сохраняет рабочий вертикальный сценарий после каждого этапа. Следующий этап начинается только после прохождения проверок предыдущего либо после документирования внешнего блокера.

## Общие правила готовности этапа

1. TypeScript strict: `npm run typecheck`.
2. ESLint: `npm run lint`.
3. Unit/component tests: `npm run test`.
4. Playwright: `npm run test:e2e` в подготовленном окружении.
5. Production build: `npm run build`.
6. Миграции, `.env.example` и документация синхронизированы с кодом.
7. Ошибки не скрыты, реальные интеграции без credentials не изображаются работающими.

## Этап 0. Анализ — текущий этап

- [x] Проверить репозиторий: исходная папка пуста.
- [x] Зафиксировать продуктовую спецификацию и границы MVP.
- [x] Описать архитектуру модульного монолита.
- [x] Зафиксировать решения и обратимые допущения.
- [x] Описать модель данных, PageSchema и draft/published boundary.
- [x] Подготовить `.env.example` без секретов.
- [x] Подтвердить актуальную связку Next.js 16, Better Auth 1.6 и Prisma 7 по официальной документации.

Результаты: `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `.env.example`.

## Этап 1. Рабочий вертикальный прототип

### 1.1. Каркас

- Next.js App Router, React, TypeScript strict, Tailwind CSS, базовые shadcn/ui-компоненты;
- централизованные product config и env validation;
- Prisma 7 + PostgreSQL driver adapter, начальная миграция;
- Better Auth models, email/password config и console email provider для разработки;
- CSP/security headers, структурированные ошибки и health endpoint.

### 1.2. Домен и генерация

- строгие Zod-схемы темы, SEO, actions, кнопок и 15 block types;
- `LLMProvider` contract и deterministic `MockLLMProvider`;
- безопасная нормализация/очистка текста;
- owner-scoped создание проекта и PageVersion;
- тесты схемы и mock-генератора.

### 1.3. Пользовательский путь

- главная с prompt composer и примерами;
- регистрация, подтверждение email, вход/выход, forgot/reset password;
- хранение pending prompt в sessionStorage;
- экран реальных этапов генерации;
- кабинет проектов и создание нового проекта.

### 1.4. Редактор и публикация

- простой трёхпанельный редактор;
- выбор блока, редактирование основных текстов и темы;
- перемещение/скрытие/дублирование/удаление базовыми командами;
- debounce/autosave с индикатором и защита от ухода при несохранённых данных;
- server-side owner checks и PageSchema validation;
- атомарная публикация draft → published и версия `publish`;
- независимый публичный renderer `/s/{slug}`.

### 1.5. Поставка

- seed подтверждённого пользователя и демонстрационного проекта;
- Dockerfile, Docker Compose, Caddyfile;
- README с локальным запуском;
- smoke/unit/e2e тесты и отчёт об известных ограничениях.

## Этап 2. Полный редактор

- каталог 15 блоков и 2–4 варианта каждого;
- dnd-kit с клавиатурными сенсорами;
- inline editing, правая панель всех настроек, desktop/tablet/mobile;
- undo/redo и минимум 20 локальных/серверных версий;
- AI page/block patches с одной repair-попыткой;
- загрузка JPEG/PNG/WebP через безопасный storage pipeline.

## Этап 3. Формы и заявки

- schema-driven поля и согласие на обработку данных;
- серверная Zod-валидация, honeypot, payload limit, rate limit, IP hash;
- Submission UI, статусы, удаление и CSV для Pro;
- зашифрованный Telegram token, тест соединения и уведомления.

## Этап 4. Аналитика

- валидированный ID Яндекс Метрики и флаги Вебвизора;
- безопасно сформированный platform-owned script только на published site;
- события CTA/form/phone/Telegram и CSP-проверка.

## Этап 5. Тарифы

- server-side Free/Pro entitlement service и квоты;
- MockBillingProvider для локального режима;
- YooKassa checkout/webhook с подписью и идемпотентностью;
- отмена автопродления и состояния failed/canceled.

## Этап 6. Домены

- hostname validation, уникальность и verification token;
- TXT + CNAME/A инструкции и DNS checks;
- DomainInfrastructureProvider, attach/detach и статусы;
- Caddy on-demand TLS эксплуатационный процесс;
- отключённая без credentials заготовка RegruDomainProvider.

## Этап 7. Production hardening

- расширенные security/rate-limit/audit проверки;
- наблюдаемость, health checks и ротация логов;
- ежедневный PostgreSQL backup, retention и restore drill;
- production deployment на Ubuntu VPS/Timeweb Cloud;
- полная Playwright-матрица, accessibility и responsive проверки;
- юридический checklist и финальная документация эксплуатации.

## Риски и контроль

| Риск                               | Контроль                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Невалидный или опасный AI-ответ    | JSON-only, `.strict()` Zod schemas, allowlist и одна repair-попытка         |
| Утечка чужого проекта              | Session + `userId` в каждом owner-scoped query                              |
| Черновик попал в production        | Публичный renderer читает только immutable published snapshot               |
| Потерян prompt при регистрации     | SessionStorage с очисткой только после успешного создания                   |
| Секрет попал в browser/log         | server-only env, redaction и запрещённый client import                      |
| Mock принят за реальную интеграцию | Явный badge/документация и fail-closed provider selection                   |
| Несовместимая миграция             | Проверяемый SQL migration, deploy-only production flow, backup перед deploy |

## Порядок внешних действий владельца

До локального запуска нужны Node.js LTS и Docker Desktop. Перед production понадобятся VPS, домен, SMTP, GigaChat и при включении платных функций credentials ЮKassa/Telegram/S3. Настоящие ключи вводятся только в локальный `.env` или secrets окружения и никогда не отправляются в чат или репозиторий.
