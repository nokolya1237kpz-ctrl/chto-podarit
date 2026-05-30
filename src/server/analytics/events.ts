export const ANALYTICS_EVENTS = {
  searchCompare: 'search_compare',
  productClick: 'product_click',
  giftQuizComplete: 'gift_quiz_complete',
  favoriteAdd: 'favorite_add',
  favoriteRemove: 'favorite_remove',
  priceWatchAdd: 'price_watch_add',
  priceWatchRemove: 'price_watch_remove',
  importError: 'import_error',
  productView: 'product_view',
  categoryView: 'category_view',
  compareResultClick: 'compare_result_click',
  marketplaceSearchClick: 'marketplace_search_click',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS] | string;
