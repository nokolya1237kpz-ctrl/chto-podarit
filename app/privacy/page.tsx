import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — ЧтоПодарить',
  description: 'Политика конфиденциальности сайта ЧтоПодарить: данные, cookie, партнёрские ссылки и контакты.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_120px_rgba(15,23,42,0.5)]">
        <h1 className="text-4xl font-bold mb-6">Политика конфиденциальности</h1>
        <p className="text-slate-400 mb-6">На этой странице описано, какие данные собирает сайт и как они используются.</p>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Какие данные собирает сайт</h2>
          <p className="text-slate-300 leading-7">Мы можем собирать данные, связанные с использованием сервиса: выбор подарков, предпочтения, параметры поиска и технические данные об устройстве. Персональные банковские данные не сохраняются.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Использование cookie</h2>
          <p className="text-slate-300 leading-7">Сайт использует cookie для работы интерфейса, сохранения сессий и улучшения качества сервиса. Cookie помогают запомнить настройки и сделать подбор подарков удобнее.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Цели использования данных</h2>
          <p className="text-slate-300 leading-7">Данные используются для подбора подарков, персонализации рекомендаций и улучшения сервиса. Мы анализируем поведение, чтобы сделать предложения более релевантными.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Партнёрские ссылки</h2>
          <p className="text-slate-300 leading-7">Сайт может содержать партнёрские ссылки. При переходе по таким ссылкам вы переходите на сторонние маркетплейсы, где оформляется покупка.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Переход на внешние сайты</h2>
          <p className="text-slate-300 leading-7">Если вы переходите на маркетплейсы, вы покидаете сайт ЧтоПодарить и попадаете на внешние ресурсы. Мы не контролируем условия покупки на этих площадках.</p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Никаких банковских данных</h2>
          <p className="text-slate-300 leading-7">Сайт не хранит банковские данные пользователей и не обрабатывает платежи напрямую. Оплата происходит на стороне партнёров и маркетплейсов.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Контакты</h2>
          <p className="text-slate-300 leading-7">Если у вас есть вопросы, пишите на <a className="text-purple-300 hover:text-purple-200 transition" href="mailto:support@что-подарить.online">support@что-подарить.online</a>.</p>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-500">Вернуться назад: <Link href="/" className="text-slate-200 hover:text-white">Главная</Link></div>
      </div>
      <Footer />
    </main>
  );
}
