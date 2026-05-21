import { RetailProvider } from './retailProvider';

export class MvideoProvider extends RetailProvider {
  constructor() {
    super({
      id: 'mvideo',
      name: 'М.Видео',
      marketplace: 'mvideo',
      sourceProvider: 'mvideo',
      searchUrlTemplate: 'https://www.mvideo.ru/product-list-page?q={query}',
    });
  }
}
