# Technical Debt

Этот файл фиксирует, что уже вынесено в новую архитектуру и что осталось переносить следующими безопасными шагами.

## Уже переведено на `src`

- `/compare` теперь использует `src/features/product-comparison`.
- `/admin/products` использует `src/features/admin-products/ui/ProductTable` и общий `DataTable`.
- `/admin/import-file`, `/admin/url-import`, `/admin/feeds`, `/admin/bulk-import` стали тонкими routes, реальные page components лежат в `src/features/product-import/ui`.
- Product domain, import pipeline, providers, parsers, Supabase helpers и admin auth физически перенесены в `src`.
- Старые `lib/*` и `types/*` оставлены как re-export wrappers для совместимости.

## Legacy routes и UI, которые ещё требуют отдельного переноса

- `/admin/epn`
- `/admin/price-sources`
- `/admin/sources`
- `/admin/sync`
- `/admin/quick-add-epn`
- `/admin/admitad`
- `/admin/admitad-import`
- `/admin/ozon`
- `/quiz`, `/results`, `/vk`

## Legacy lib modules

- `lib/epn.ts`
- `lib/admitad.ts`
- `lib/affiliate.ts`
- `lib/marketplaces.ts`
- `lib/fileImport.ts`
- `lib/feedPipeline.ts`
- `lib/scraperDataset.ts`
- `lib/priceSnapshots.ts`
- `lib/trends`
- `lib/giftSeo.ts`
- `lib/productMatcher.ts`

## Provider risk

- Direct marketplace providers остаются нестабильными из-за 403/429/captcha.
- Production-safe стратегия должна оставаться API/feed/URL-import-first.
- WB JSON provider полезен как optional source, но не должен быть единственным источником импорта.

## Следующий refactor step

1. Перенести `lib/epn.ts` в `src/features/epn-integration` и `src/server/providers/epn`.
2. Перенести `lib/admitad.ts` в `src/features/admitad-integration`.
3. Подключить React Query provider в root layout и перевести compare/admin products fetch на `useQuery`.
4. Разделить product-import page features на маленькие формы: `FileImportForm`, `UrlImportForm`, `FeedImportForm`, `BulkImportPanel`.
5. Перенести `/quiz` и `/results` в `src/features/gift-quiz`.

## Architecture rules

- `entities` не импортируют `features`.
- `features` могут импортировать `entities`, `components/ui`, `lib`, но не должны хаотично импортировать другие features.
- `widgets` могут собирать features/entities в крупные блоки.
- `server` не импортирует client UI.
- `@server/*` не использовать в client components.
