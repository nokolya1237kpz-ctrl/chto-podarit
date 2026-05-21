"use client";
import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-3 sm:top-5 z-50 px-3 sm:px-4 w-full max-w-full box-border overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl w-full items-center justify-between gap-2 sm:gap-4 rounded-xl sm:rounded-[28px] border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl box-border">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="flex h-9 sm:h-11 w-9 sm:w-11 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_20px_60px_rgba(124,58,237,0.3)] flex-shrink-0">
            <span className="text-sm sm:text-lg font-black text-white">ЧП</span>
          </div>
          <span className="hidden sm:block text-base font-semibold tracking-[0.02em] text-white">ЧтоПодарить</span>
        </Link>

        <nav className="hidden items-center gap-4 sm:gap-6 sm:flex">
          <Link href="/quiz" className="text-sm font-medium text-slate-200/90 transition hover:text-white">Анкета</Link>
          <Link href="/compare" className="text-sm font-medium text-slate-200/90 transition hover:text-white">Сравнить цены</Link>
          <Link href="/results" className="text-sm font-medium text-slate-200/90 transition hover:text-white">Результаты</Link>
          <Link href="/vk" className="text-sm font-medium text-slate-200/90 transition hover:text-white">VK Mini App</Link>
          <Link href="/quiz" className="ml-2">
            <button className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_16px_50px_rgba(124,58,237,0.25)] transition hover:brightness-110">Начать подбор</button>
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
            <Link href="/results" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">Результаты</Link>
            <Link href="/vk" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">VK Mini App</Link>
            <Link href="/quiz" onClick={closeMenu} className="rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 py-2.5 text-sm font-semibold text-white text-center shadow-[0_16px_50px_rgba(124,58,237,0.25)]">Начать подбор</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
