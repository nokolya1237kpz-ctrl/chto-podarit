import { ManualProvider } from './manualProvider';
import { AdmitadProvider } from './admitadProvider';
import { EpnProvider } from './epnProvider';
import { CityAdsProvider } from './cityadsProvider';
import { AliExpressProvider } from './aliexpressProvider';
import { YandexMarketProvider } from './yandexMarketProvider';
import { OzonProvider } from './ozonProvider';
import { WildberriesProvider } from './wildberriesProvider';
import { DirectApiProvider } from './directApiProvider';
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
};

export function getProviderById(id: string): ProductProvider | undefined {
  return providers[id];
}

export function getAllProviders(): ProductProvider[] {
  return Object.values(providers);
}
