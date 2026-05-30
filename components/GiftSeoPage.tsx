import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import type { Product } from '@/types/product';

type GiftSeoPageProps = {
  title: string;
  description: string;
  products: Product[];
  canonical?: string;
  faq?: Array<{ question: string; answer: string }>;
};

const defaultFaq = [
  { question: 'Как выбрать подходящий подарок?', answer: 'Укажите получателя, повод, интересы и бюджет. Сервис отфильтрует нерелевантные товары и покажет подходящие варианты из каталога.' },
  { question: 'Можно ли сразу перейти к товару?', answer: 'Да. В карточках есть ссылки на страницы продавцов или партнёрские ссылки, если они доступны.' },
  { question: 'Как быстро обновляется подборка?', answer: 'Каталог обновляется после импорта товаров и публикации новых предложений в административной панели.' },
];

export default function GiftSeoPage({ title, description, products, canonical = '/', faq = defaultFaq }: GiftSeoPageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn----8sba3adk3a1a.xn--p1ai';
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Подборки подарков', item: `${baseUrl}/gifts` },
      { '@type': 'ListItem', position: 3, name: title, item: `${baseUrl}${canonical}` },
    ],
  };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) };
  const productsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 24).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        image: product.imageUrl,
        description: product.description || product.title,
        offers: { '@type': 'Offer', price: product.price, priceCurrency: product.currency || 'RUB', url: product.affiliateUrl || product.originalUrl || `${baseUrl}${canonical}`, availability: 'https://schema.org/InStock' },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Гид по подаркам</p>
          <h1 className="mt-3 text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-4xl text-slate-400">{description}</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">В подборке собраны опубликованные товары из каталога с актуальными ценами, изображениями и ссылками на страницы продавцов. Используйте готовые идеи как отправную точку или пройдите короткую анкету: алгоритм учтёт бюджет, получателя и повод, а затем исключит неподходящие категории.</p>
          <a href="/quiz" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3 font-semibold">Пройти анкету</a>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {products.map((product) => <GiftCard key={product.id} gift={product} />)}
        </section>
        <section className="mt-10 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-bold">Частые вопросы</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faq.map((item) => <article key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="font-semibold">{item.question}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.answer}</p></article>)}
          </div>
        </section>
        <nav className="mt-8 flex flex-wrap gap-3 text-sm">
          <a href="/catalog" className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Каталог товаров</a>
          <a href="/compare" className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Сравнить цены</a>
          <a href="/gifts/for-girlfriend" className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Подарки девушке</a>
          <a href="/gifts/by-budget/do-3000" className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Подарки до 3000 ₽</a>
        </nav>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productsSchema) }} />
      </main>
      <Footer />
    </div>
  );
}
