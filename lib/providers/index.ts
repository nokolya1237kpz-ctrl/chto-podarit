import { ManualProvider } from './manualProvider';
import { AdmitadProvider } from './admitadProvider';
import { EpnProvider } from './epnProvider';
import { CityAdsProvider } from './cityadsProvider';
import { AliExpressProvider } from './aliexpressProvider';
import { YandexMarketProvider } from './yandexMarketProvider';
import { OzonProvider } from './ozonProvider';
import { WildberriesProvider } from './wildberriesProvider';
import { DirectApiProvider } from './directApiProvider';
import { FeedProvider } from './feedProvider';
import { ParserProvider } from './parserProvider';
import { DnsShopProvider } from './dnsShopProvider';
import { CitilinkProvider } from './citilinkProvider';
import { MegamarketProvider } from './megamarketProvider';
import { MvideoProvider } from './mvideoProvider';
import { EldoradoProvider } from './eldoradoProvider';
import { SearchApiProvider } from './searchApiProvider';
import type { ProductProvider } from './types';

export const providers: Record<string, ProductProvider> = {
  manual: new ManualProvider(),
  admitad: new AdmitadProvider(),
  epn: new EpnProvider(),
  cityads: new CityAdsProvider(),
  aliexpress: new AliExpressProvider(),
  yandex_market: new YandexMarketProvider(),
  ozon: new OzonProvider(),
  wildberries: new WildberriesProvider(),
  direct_api: new DirectApiProvider(),
  feed: new FeedProvider(),
  parser: new ParserProvider(),
  dns_shop: new DnsShopProvider(),
  citilink: new CitilinkProvider(),
  megamarket: new MegamarketProvider(),
  mvideo: new MvideoProvider(),
  eldorado: new EldoradoProvider(),
  search_api: new SearchApiProvider(),
};

export function getProviderById(id: string): ProductProvider | undefined {
  return providers[id];
}

export function getAllProviders(): ProductProvider[] {
  return Object.values(providers);
}
