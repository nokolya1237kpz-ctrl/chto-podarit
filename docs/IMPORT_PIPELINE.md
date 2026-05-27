# Import Pipeline

Цель pipeline — быстро наполнять каталог, но не публиковать мусор и не восстанавливать удалённые товары автоматически.

## Поток данных

1. **Source**
   - URL import
   - CSV/XLSX/JSON
   - Feed
   - ePN/Admitad creatives или hot goods
   - Search API

2. **Normalize**
   - привести поля к единому виду: `title`, `description`, `price`, `oldPrice`, `imageUrl`, `originalUrl`, `affiliateUrl`, `marketplace`, `externalProductId`.
   - очистить title и URL.
   - определить marketplace.

3. **Enrichment**
   - если нет image/description/price, попробовать metadata страницы товара.
   - поддерживать `og:title`, `og:image`, `og:description`, JSON-LD Product, schema.org Product.

4. **AutoFill**
   - заполнить `recipients`, `interests`, `occasions`, `giftTypes`, `budget`, `wowRating`, `riskLevel`.
   - не перетирать вручную заполненные поля без необходимости.

5. **Quality Gate**
   - `title + image + price > 0` → `status=active`, `isActive=true`.
   - `title + url`, но нет price/image → `status=draft`, `isActive=false`.
   - нет `title` → skip.
   - soft deleted товары не восстанавливать автоматически.

6. **Dedupe**
   - основной ключ: `externalProductId`.
   - fallback: normalized URL.
   - дополнительный fallback: cleaned title + marketplace.

7. **Save**
   - сохранить product.
   - сохранить price history, если есть цена.
   - вернуть понятный report: active, draft, skipped, duplicates, enriched, errors.

## Ошибки

Нельзя показывать ложный успех вида “импортировано 0, ошибок 0”. Если импорт дал 0 товаров, report должен содержать причину: `fetch_failed`, `source_blocked`, `no_items`, `missing_title`, `duplicate`, `unsupported_format`, `captcha_required`.

## Безопасность

- Не использовать captcha bypass, stealth browser, proxy rotation.
- Все секреты и внешние API-запросы выполнять server-side.
- User-facing UI не показывает сырой debug, только понятные сообщения.
