import Header from '../components/Header';
import Footer from '../components/Footer';
import PopularCollections from '../components/PopularCollections';
import LottiePlayer from '../components/LottiePlayer';
import ScrollReveal from '../components/ScrollReveal';
import HeroPreview from '../components/HeroPreview';

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),transparent_0%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),transparent_25%),linear-gradient(180deg,#070a12,#0b1020)] text-white">
      <Header />
      <main className="pt-24 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/72 p-8 sm:p-11 shadow-[0_52px_140px_rgba(15,23,42,0.36)] backdrop-blur-3xl">
            <div className="hero-decor" />
            <div className="ambient-glow" />
            
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] items-start">
              {/* Left Content */}
              <div className="space-y-7 relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-pink-200 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                  Быстро. Персонально. Премиально.
                </div>
                <div className="space-y-4">
                  <h1 className="hero-title-3d">Найдём идеальный подарок за 30 секунд</h1>
                  <p className="text-lg leading-8 text-slate-300 max-w-2xl font-light">Ответьте на 5 вопросов и получите 10 персональных идей с ценами, вау‑рейтингом и ссылками на товары.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
                  <a href="/quiz" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-8 py-4 text-base font-semibold text-white shadow-[0_24px_100px_rgba(124,58,237,0.38)] transition hover:brightness-110 hover:shadow-[0_32px_130px_rgba(124,58,237,0.48)]">Подобрать подарок</a>
                  <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20 backdrop-blur-sm">Как это работает</a>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-4">
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Топ‑идеи</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">10 лучших вариантов, подобранных по бюджету и настроению.</p>
                  </div>
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Персональный алгоритм</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">Учитывает получателя, повод, интересы и стиль.</p>
                  </div>
                  <div className="feature-card group">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300 mb-3 group-hover:text-pink-300 transition">Дизайн премиум</div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-200 transition">Интерфейс как у современных сервисов премиум-класса.</p>
                  </div>
                </div>
              </div>

              {/* Right Preview */}
              <ScrollReveal>
                <div className="relative rounded-[2rem] border border-white/12 bg-slate-950/95 p-1 shadow-[0_40px_120px_rgba(15,23,42,0.35)] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                  <div className="relative rounded-[1.95rem] overflow-hidden">
                    <HeroPreview />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="grid gap-6 lg:grid-cols-3">
            {[
              { num: 'О', title: 'Ответьте на 5 вопросов', text: 'Это займёт меньше минуты.' },
              { num: 'М', title: 'Мы подберём идеи', text: 'Учитываем интересы, повод и бюджет.' },
              { num: 'В', title: 'Выбирайте лучшие подарки', text: 'С ценами, рейтингом и ссылкой.' }
            ].map((item, idx) => (
              <div key={item.title} className="premium-card rounded-[2rem] p-8 group">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] text-xl font-bold text-white shadow-[0_12px_40px_rgba(124,58,237,0.25)] group-hover:shadow-[0_16px_60px_rgba(124,58,237,0.35)] transition">{item.num}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition">{item.text}</p>
              </div>
            ))}
          </section>

          {/* Popular Collections */}
          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300 mb-2">Популярные подборки</p>
                <h2 className="text-3xl font-bold text-white">Готовые фильтры для быстрого старта</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-xl leading-6">Если хотите начать прямо сейчас — выберите один из готовых запросов.</p>
            </div>
            <PopularCollections />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}