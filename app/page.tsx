import Header from '../components/Header';
import Footer from '../components/Footer';
import PopularCollections from '../components/PopularCollections';
import LottiePlayer from '../components/LottiePlayer';
import ScrollReveal from '../components/ScrollReveal';
import RotatingHeroProducts from '../components/RotatingHeroProducts';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import type { Product } from '@/types/product';

export default async function Home() {
  let products: Product[] = [];
  if (isSupabaseConfigured()) {
    products = await getActiveProducts();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),transparent_0%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),transparent_25%),linear-gradient(180deg,#070a12,#0b1020)] text-white">
      <Header />
      <main className="w-full max-w-full overflow-x-hidden pt-20 px-4 pb-20 sm:pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-12 box-border overflow-x-hidden">
          <section className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-white/10 bg-slate-950/72 p-4 sm:p-8 sm:p-11 shadow-[0_52px_140px_rgba(15,23,42,0.36)] backdrop-blur-3xl w-full max-w-full box-sizing">
            <div className="hero-decor" />
            <div className="ambient-glow" />
            
            <div className="grid gap-4 sm:gap-8 lg:grid-cols-[1.35fr_0.9fr] items-start w-full">
              {/* Left Content */}
              <div className="space-y-4 sm:space-y-6 relative z-10 w-full max-w-full overflow-hidden">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-pink-200 backdrop-blur-sm max-w-full overflow-hidden text-ellipsis">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex-shrink-0" />
                  <span className="truncate">Быстро. Персонально. Премиально.</span>
                </div>
                <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
                  <h1 className="w-full max-w-full text-[2.35rem] font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
                    <div className="text-white whitespace-normal break-words">Найдём</div>
                    <div className="bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text pb-1 text-transparent break-words">идеальный подарок</div>
                    <div className="text-[0.72em] text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.18)] whitespace-normal break-words">за 30 секунд</div>
                  </h1>
                  <p className="text-base sm:text-lg leading-7 sm:leading-8 text-slate-300 w-full max-w-2xl font-light">Ответьте на 5 вопросов и получите 10 персональных идей с ценами, вау‑рейтингом и ссылками на товары.</p>
                  <p className="max-w-xl text-sm leading-6 text-slate-400">Подборка собирается из реальных товаров и помогает быстро выбрать подарок под человека, повод и бюджет.</p>
                </div>

                <div className="flex flex-col gap-3 w-full pt-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                  <a href="/quiz" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-[0_24px_100px_rgba(124,58,237,0.38)] transition hover:brightness-110 hover:shadow-[0_32px_130px_rgba(124,58,237,0.48)] w-full sm:w-auto">Подобрать подарок</a>
                  <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20 backdrop-blur-sm w-full sm:w-auto">Как это работает</a>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 pt-4 w-full max-w-full">
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Топ‑идеи</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">10 лучших вариантов, подобранных по бюджету и настроению.</p>
                  </div>
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Персональный алгоритм</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">Учитывает получателя, повод, интересы и стиль.</p>
                  </div>
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Дизайн премиум</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">Интерфейс как у современных сервисов премиум-класса.</p>
                  </div>
                </div>
              </div>

              {/* Right Preview - Hidden on mobile */}
              <ScrollReveal>
                <div className="hidden lg:block relative rounded-[2rem] border border-white/12 bg-slate-950/95 p-1 shadow-[0_40px_120px_rgba(15,23,42,0.35)] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                  <div className="relative rounded-[1.95rem] overflow-hidden">
                    <RotatingHeroProducts products={products} />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Подбор за 30 секунд', 'Короткий квиз вместо долгого поиска.'],
              ['Товары с маркетплейсов', 'Идеи из реального каталога с актуальными ссылками.'],
              ['Партнёрские ссылки', 'Можно сразу перейти к покупке у продавца.'],
              ['Цены и рейтинг', 'Быстрее сравнить варианты и выбрать лучший.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 w-full max-w-full">
            {[
              { num: 'О', title: 'Ответьте на 5 вопросов', text: 'Это займёт меньше минуты.' },
              { num: 'М', title: 'Мы подберём идеи', text: 'Учитываем интересы, повод и бюджет.' },
              { num: 'В', title: 'Выбирайте лучшие подарки', text: 'С ценами, рейтингом и ссылкой.' }
            ].map((item, idx) => (
              <div key={item.title} className="premium-card rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 group">
                <div className="mb-5 inline-flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-lg sm:text-xl font-bold text-white shadow-[0_12px_40px_rgba(124,58,237,0.25)] group-hover:shadow-[0_16px_60px_rgba(124,58,237,0.35)] transition">{item.num}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400 group-hover:text-slate-300 transition">{item.text}</p>
              </div>
            ))}
          </section>

          {/* Popular Collections */}
          <section className="space-y-4 sm:space-y-6 w-full max-w-full">
            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-300 mb-2">Популярные подборки</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Готовые фильтры для быстрого старта</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-5 sm:leading-6">Если хотите начать прямо сейчас — выберите один из готовых запросов.</p>
            </div>
            <PopularCollections />
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_32px_100px_rgba(15,23,42,0.28)] backdrop-blur-2xl sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Быстрый старт</p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Не знаете, что выбрать?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Ответьте на 5 вопросов — мы подберём идеи под бюджет и повод.</p>
              </div>
              <a href="/quiz" className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(124,58,237,0.32)] transition hover:brightness-110 sm:w-auto">
                Начать подбор
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
