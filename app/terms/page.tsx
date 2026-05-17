import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение — ЧтоПодарить',
  description: 'Пользовательское соглашение сервиса ЧтоПодарить: описание сервиса, рекомендации и ответственность.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_120px_rgba(15,23,42,0.5)]">
        <h1 className="text-4xl font-bold mb-6">Пользовательское соглашение</h1>
        <p className="text-slate-400 mb-6">Здесь описаны условия использования сервиса ЧтоПодарить.</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Описание сервиса</h2>
          <p className="text-slate-300 leading-7">ЧтоПодарить — это сервис, который помогает подобрать идеи подарков на основе бюджета, интересов и повода.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Рекомендации носят информационный характер</h2>
          <p className="text-slate-300 leading-7">Рекомендации, представленные на сайте, носят исключительно информационный характер и не являются офертой или гарантией.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Сайт не является продавцом</h2>
          <p className="text-slate-300 leading-7">ЧтоПодарить не является продавцом товаров. Мы предоставляем идеи и ссылки на маркетплейсы и партнёров.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Покупка на стороне партнёров</h2>
          <p className="text-slate-300 leading-7">Любая покупка совершается на стороне маркетплейсов или партнёров. Условия оплаты, доставки и возврата зависят от выбранного магазина.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Изменения цен и наличия</h2>
          <p className="text-slate-300 leading-7">Цены и наличие товаров могут меняться без предварительного уведомления. Мы не можем гарантировать актуальность каждой позиции в момент перехода.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Решение о покупке</h2>
          <p className="text-slate-300 leading-7">Пользователь самостоятельно принимает решение о покупке и несёт ответственность за выбор товара и условия покупки.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Партнёрское вознаграждение</h2>
          <p className="text-slate-300 leading-7">Сайт может получать партнёрское вознаграждение за переходы и покупки по партнёрским ссылкам. Это помогает поддерживать и развивать сервис.</p>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-500">Вернуться назад: <Link href="/" className="text-slate-200 hover:text-white">Главная</Link></div>
      </div>
      <Footer />
    </main>
  );
}
