import { RetailProvider } from './retailProvider';

export class DnsShopProvider extends RetailProvider {
  constructor() {
    super({
      id: 'dns_shop',
      name: 'DNS',
      marketplace: 'dns_shop',
      sourceProvider: 'dns_shop',
      searchUrlTemplate: 'https://www.dns-shop.ru/search/?q={query}',
    });
  }
}
