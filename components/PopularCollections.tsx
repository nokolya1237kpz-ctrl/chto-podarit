import React from 'react';

const collections = [
  { title: 'Подарки для неё', params: 'recipient=Девушка', icon: '✨' },
  { title: 'До 3000 ₽', params: 'budget=1000–3000 ₽', icon: '💎' },
  { title: 'Подарки для него', params: 'recipient=Парню', icon: '⚡' },
  { title: 'Романтические', params: 'giftType=Романтичный', icon: '💝' }
];

export default function PopularCollections() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {collections.map((collection) => (
        <a
          key={collection.title}
          href={`/results?${collection.params}`}
          className="group relative flex h-44 flex-col justify-between rounded-[2rem] border border-white/11 bg-gradient-to-br from-slate-950/85 to-slate-950/75 p-6 text-left text-white shadow-[0_24px_90px_rgba(15,23,42,0.28)] transition duration-300 overflow-hidden hover:border-white/16 hover:shadow-[0_32px_130px_rgba(124,58,237,0.32)]"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/8 via-transparent to-pink-500/8 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
          <div className="relative">
            <div className="text-3xl mb-3 transform group-hover:scale-110 transition duration-300">{collection.icon}</div>
          </div>
          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-[0.26em] text-purple-300 opacity-75 group-hover:opacity-100 transition">Подборка</span>
            <span className="mt-2 block text-lg font-semibold text-white group-hover:text-pink-200 transition">{collection.title}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
        </a>
      ))}
    </div>
  );
}
