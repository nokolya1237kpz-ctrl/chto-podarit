# Архитектура проекта

Проект остаётся на Next.js App Router с текущими рабочими маршрутами в `app/`. Полный перенос `app/` в `src/app` пока не выполняется: это отдельный шаг, который нужно делать после стабилизации доменных слоёв и покрытия ключевых сценариев проверками.

## Текущая стратегия

- `app/` хранит маршруты, API routes и минимальную связку с фичами.
- `components/` остаётся совместимым слоем для старых импортов.
- `lib/` остаётся совместимым слоем для старых бизнес-функций.
- `src/` становится целевой структурой для нового кода и постепенного переноса.

## Целевая структура

- `src/entities` — доменные сущности: товар, маркетплейс, оффер цены, import job.
- `src/features` — пользовательские сценарии: импорт, сравнение цен, ePN, gift quiz, админские товары.
- `src/widgets` — крупные композиционные блоки: admin shell, sidebar, header, hero, grids.
- `src/components/ui` — маленькие переиспользуемые UI-компоненты без бизнес-логики.
- `src/lib` — клиент-безопасные утилиты, конфиги, helpers.
- `src/server` — server-only логика: провайдеры, парсеры, API-клиенты, security, diagnostics.
- `src/hooks`, `src/types`, `src/data` — общие хуки, типы и данные.

## Правила импортов

- Новый feature-код импортировать через алиасы: `@features/*`, `@entities/*`, `@widgets/*`, `@components/*`, `@lib/*`, `@server/*`.
- Старые импорты `@/lib/*` и `@/components/*` сохраняются до постепенного переноса.
- Server-only код с секретами должен жить в `src/server/*` или текущем `lib/*`, но не импортироваться в client components.
- UI-компоненты не должны напрямую читать `process.env` и обращаться к Supabase service role.

## Как добавлять provider

1. Типы и контракт держать рядом с `src/server/providers`.
2. HTTP, rate limit и diagnostics держать в server-слое.
3. Нормализацию результата выносить в entity/feature lib.
4. Публичные страницы должны получать только нормализованные безопасные данные.

## Как добавлять admin page

1. Route создаётся в `app/admin/...`.
2. Layout берётся через совместимый `components/admin/AdminShell`, который уже смотрит на `src/widgets/admin-page-shell`.
3. Feature UI кладётся в `src/features/<feature>/ui`.
4. API contracts описываются zod-схемами в `src/features/<feature>/schema.ts`.

## Следующие безопасные шаги

- Перенести реальные функции `productAutoFill`, `productNormalize`, `importProduct` в `src` и оставить старые файлы как re-export wrappers.
- Подключить `/compare` к `src/features/product-comparison/ui`.
- Подключить страницы импортов к `src/features/product-import/ui`.
- После каждого шага запускать `npm run build`.
