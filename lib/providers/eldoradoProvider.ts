import { RetailProvider } from './retailProvider';

export class EldoradoProvider extends RetailProvider {
  constructor() {
    super({
      id: 'eldorado',
      name: 'Эльдорадо',
      marketplace: 'eldorado',
      sourceProvider: 'eldorado',
      searchUrlTemplate: 'https://www.eldorado.ru/search/catalog.php?q={query}',
    });
  }
}
