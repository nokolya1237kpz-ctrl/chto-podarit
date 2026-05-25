"use client";
import Link from 'next/link';
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-3 sm:top-5 z-50 px-3 sm:px-4 w-full max-w-full box-border overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl w-full items-center justify-between gap-2 sm:gap-4 rounded-xl sm:rounded-[28px] border border-white/12 bg-slate-950/58 px-3 sm:px-4 py-2 sm:py-3 shadow-[0_28px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl box-border">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="flex h-9 sm:h-11 w-9 sm:w-11 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#d946ef] to-[#ff5ba7] shadow-[0_20px_70px_rgba(139,92,246,0.34)] flex-shrink-0">
            <span className="text-sm sm:text-lg font-black text-white">ЧП</span>
          </div>
          <span className="hidden sm:block text-base font-semibold tracking-[0.02em] text-white">ЧтоПодарить</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/5 p-1 sm:flex">
          <Link href="/quiz" className="rounded-full px-3 py-2 text-sm font-medium text-slate-200/88 transition hover:bg-white/8 hover:text-white">Анкета</Link>
          <Link href="/compare" className="rounded-full px-3 py-2 text-sm font-medium text-slate-200/88 transition hover:bg-white/8 hover:text-white">Сравнить цены</Link>
          <Link href="/trends" className="rounded-full px-3 py-2 text-sm font-medium text-slate-200/88 transition hover:bg-white/8 hover:text-white">Тренды</Link>
          <Link href="/results" className="rounded-full px-3 py-2 text-sm font-medium text-slate-200/88 transition hover:bg-white/8 hover:text-white">Результаты</Link>
          <Link href="/vk" className="rounded-full px-3 py-2 text-sm font-medium text-slate-200/88 transition hover:bg-white/8 hover:text-white">VK Mini App</Link>
          <Link href="/quiz" className="ml-2">
            <button className="premium-button rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold">Начать подбор</button>
          </Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 sm:h-11 w-9 sm:w-11 flex-col items-center justify-center gap-1.5 rounded-lg sm:rounded-2xl border border-white/10 bg-slate-950/60 text-white shadow-[0_18px_40px_rgba(15,23,42,0.32)] sm:hidden"
            aria-label="Открыть меню"
          >
            <span className="h-0.5 w-5 rounded-full bg-white transition-transform" />
            <span className="h-0.5 w-5 rounded-full bg-white transition-transform" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed left-0 right-0 top-[calc(56px+12px)] sm:top-[84px] z-40 mx-3 sm:mx-4 rounded-xl sm:rounded-[28px] border border-white/10 bg-slate-950/95 p-3 sm:p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:hidden w-[calc(100%-24px)] box-border">
          <div className="flex flex-col gap-2">
            <Link href="/quiz" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">Анкета</Link>
            <Link href="/compare" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">Сравнить цены</Link>
            <Link href="/trends" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">Тренды</Link>
            <Link href="/results" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">Результаты</Link>
            <Link href="/vk" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">VK Mini App</Link>
            <Link href="/quiz" onClick={closeMenu} className="rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 py-2.5 text-sm font-semibold text-white text-center shadow-[0_16px_50px_rgba(124,58,237,0.25)]">Начать подбор</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
