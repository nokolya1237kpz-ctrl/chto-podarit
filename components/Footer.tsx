import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-20">
      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Footer content */}
          <div className="grid gap-8 mb-8 sm:grid-cols-3">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_12px_40px_rgba(124,58,237,0.25)]">
                  <span className="text-xs font-black text-white">ЧП</span>
                </div>
                <span className="text-sm font-semibold text-white">ЧтоПодарить</span>
              </div>
              <p className="text-xs leading-6 text-slate-400">Быстрый подбор идеальных подарков за 30 секунд.</p>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Ссылки</h4>
              <div className="flex flex-col gap-2">
                <Link href="/quiz" className="text-sm text-slate-400 hover:text-slate-200 transition">Подобрать подарок</Link>
                <Link href="/#how-it-works" className="text-sm text-slate-400 hover:text-slate-200 transition">Как это работает</Link>
                <Link href="/privacy" className="text-sm text-slate-400 hover:text-slate-200 transition">Политика конфиденциальности</Link>
                <Link href="/terms" className="text-sm text-slate-400 hover:text-slate-200 transition">Пользовательское соглашение</Link>
                <Link href="/contacts" className="text-sm text-slate-400 hover:text-slate-200 transition">Контакты</Link>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Информация</h4>
              <div className="flex flex-col gap-2">
                <a href="/vk" className="text-sm text-slate-400 hover:text-slate-200 transition">VK Mini App</a>
                <a href="mailto:support@что-подарить.online" className="text-sm text-slate-400 hover:text-slate-200 transition">support@что-подарить.online</a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

          {/* Copyright */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 leading-6">© {currentYear} ЧтоПодарить. Быстрый подбор подарков для всех случаев жизни.</p>
            <div className="text-xs text-slate-600 sm:text-right">
              Сделано с любовью ❤️
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
