import { RetailProvider } from './retailProvider';

export class MegamarketProvider extends RetailProvider {
  constructor() {
    super({
      id: 'megamarket',
      name: 'Мегамаркет',
      marketplace: 'megamarket',
      sourceProvider: 'megamarket',
      searchUrlTemplate: 'https://megamarket.ru/catalog/?q={query}',
    });
  }
}
