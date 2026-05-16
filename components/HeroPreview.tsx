"use client";
import type { Gift } from '../types/gift';

const previewGifts: Array<Pick<Gift, 'id' | 'title' | 'price' | 'description' | 'wow' | 'risk'>> = [
  {
    id: 'hp-sony',
    title: 'Беспроводные наушники',
    price: 7990,
    description: 'Чистый звук и комфорт для долгих прослушиваний.',
    wow: 9,
    risk: 'низкий'
  },
  {
    id: 'spa',
    title: 'Сертификат в SPA',
    price: 4990,
    description: 'Расслабление и забота для любого праздника.',
    wow: 9,
    risk: 'средний'
  }
];

export default function HeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/88 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.4),_inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/12 backdrop-blur-2xl inner-glow">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.24),transparent_50%)]" />
      <div className="relative grid gap-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
          <span>Идеи из подборки</span>
          <span className="rounded-full border border-white/12 bg-gradient-to-r from-purple-500/12 to-pink-500/10 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-sm">10 вариантов</span>
        </div>

        <div className="grid gap-3.5">
          {previewGifts.map((gift, index) => (
            <div
              key={gift.id}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/11 bg-slate-950/92 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.35),_inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition duration-300 hover:border-white/15 hover:bg-slate-950/96 hover:shadow-[0_32px_120px_rgba(124,58,237,0.28),_inset_0_1px_0_rgba(255,255,255,0.08)] group"
            >
              <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-purple-500/6 via-transparent to-pink-500/6 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white leading-tight group-hover:text-pink-100 transition">{gift.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-5 group-hover:text-slate-300 transition">{gift.description}</p>
                </div>
                <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/16 border border-white/10 px-2.5 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-slate-200 group-hover:border-white/15 group-hover:text-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition whitespace-nowrap">{gift.risk}</div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-white">{gift.price.toLocaleString('ru-RU')} ₽</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition">Вау рейтинг</p>
                </div>
                <div className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 py-1.5 text-xs font-bold text-white shadow-[0_12px_40px_rgba(124,58,237,0.28)] group-hover:shadow-[0_18px_70px_rgba(124,58,237,0.4)] transition">{gift.wow}/10</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
