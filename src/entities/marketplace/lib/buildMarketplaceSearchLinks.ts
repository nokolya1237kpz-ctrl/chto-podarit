export type MarketplaceSearchLink = {
  marketplace: 'ozon' | 'wildberries' | 'yandex_market' | 'dns' | 'mvideo' | 'aliexpress' | 'citilink';
  label: string;
  url: string;
};

type MarketplaceSearchLinksOptions = {
  affiliate?: boolean;
};

export const MARKETPLACE_SEARCH_LINKS_SETTING = 'enableMarketplaceSearchLinks';

export function buildMarketplaceSearchLinks(
  query: string,
  _options: MarketplaceSearchLinksOptions = {},
): MarketplaceSearchLink[] {
  const encodedQuery = encodeURIComponent(query.trim());

  return [
    { marketplace: 'ozon', label: 'Ozon', url: `https://www.ozon.ru/search/?text=${encodedQuery}` },
    { marketplace: 'wildberries', label: 'Wildberries', url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodedQuery}` },
    { marketplace: 'yandex_market', label: 'Яндекс Маркет', url: `https://market.yandex.ru/search?text=${encodedQuery}` },
    { marketplace: 'dns', label: 'DNS', url: `https://www.dns-shop.ru/search/?q=${encodedQuery}` },
    { marketplace: 'mvideo', label: 'М.Видео', url: `https://www.mvideo.ru/product-list-page?q=${encodedQuery}` },
    { marketplace: 'aliexpress', label: 'AliExpress', url: `https://aliexpress.ru/wholesale?SearchText=${encodedQuery}` },
    { marketplace: 'citilink', label: 'Ситилинк', url: `https://www.citilink.ru/search/?text=${encodedQuery}` },
  ];
}
