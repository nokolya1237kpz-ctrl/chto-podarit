import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GiftQuiz from '../../components/GiftQuiz';

export default function QuizPage() {
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),transparent_0%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),transparent_25%),linear-gradient(180deg,#05060f,#090d1a)] text-white">
      <Header />

      <main className="w-full max-w-full overflow-x-hidden pt-24 sm:pt-28 px-3 sm:px-4 pb-20 sm:px-6 lg:px-8 box-border">
        <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-2xl w-full items-center justify-center">
          <div className="premium-card w-full rounded-2xl sm:rounded-[2.5rem] border-white/10 bg-slate-950/80 p-4 sm:p-8 lg:p-12 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-3xl box-border">
            <div className="mb-6 sm:mb-10 space-y-3 sm:space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-purple-300">Анкета</p>
              <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">Подберём лучший подарок за пару шагов</h1>
              <p className="max-w-2xl text-xs sm:text-base text-slate-300 leading-6 sm:leading-7 font-light">Отвечайте на вопросы быстро — мы подберём идеи подходящие под характер, повод и бюджет.</p>
            </div>
            <GiftQuiz />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
