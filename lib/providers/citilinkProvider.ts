import { RetailProvider } from './retailProvider';

export class CitilinkProvider extends RetailProvider {
  constructor() {
    super({
      id: 'citilink',
      name: 'Citilink',
      marketplace: 'citilink',
      sourceProvider: 'citilink',
      searchUrlTemplate: 'https://www.citilink.ru/search/?text={query}',
    });
  }
}
