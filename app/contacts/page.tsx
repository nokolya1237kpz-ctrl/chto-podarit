import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Контакты — ЧтоПодарить',
  description: 'Контактная информация проекта ЧтоПодарить: email поддержки, VK и сайт.',
};

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_120px_rgba(15,23,42,0.5)]">
        <h1 className="text-4xl font-bold mb-6">Контакты</h1>
        <p className="text-slate-400 mb-8">Проект «ЧтоПодарить» — сервис подбора идей подарков. Свяжитесь с нами любым удобным способом.</p>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Проект</h2>
            <p className="text-slate-300 leading-7">ЧтоПодарить</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Описание</h2>
            <p className="text-slate-300 leading-7">Сервис подбора идей подарков на основе бюджета, интересов и повода.</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Email поддержки</h2>
            <a href="mailto:support@что-подарить.online" className="text-purple-300 hover:text-purple-200 transition">support@что-подарить.online</a>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">VK</h2>
            <a href="https://vk.com/chto_podarit_app" target="_blank" rel="noreferrer" className="text-purple-300 hover:text-purple-200 transition">https://vk.com/chto_podarit_app</a>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Сайт</h2>
            <a href="https://что-подарить.online" target="_blank" rel="noreferrer" className="text-purple-300 hover:text-purple-200 transition">https://что-подарить.online</a>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-500">Вернуться назад: <Link href="/" className="text-slate-200 hover:text-white">Главная</Link></div>
      </div>
      <Footer />
    </main>
  );
}
