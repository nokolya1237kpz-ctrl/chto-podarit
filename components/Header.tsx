"use client";
import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-5 z-50 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_20px_60px_rgba(124,58,237,0.3)]">
            <span className="text-lg font-black text-white">ЧП</span>
          </div>
          <span className="text-base font-semibold tracking-[0.02em] text-white">ЧтоПодарить</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/quiz" className="text-sm font-medium text-slate-200/90 transition hover:text-white">Анкета</Link>
          <Link href="/results" className="text-sm font-medium text-slate-200/90 transition hover:text-white">Результаты</Link>
          <Link href="/vk" className="text-sm font-medium text-slate-200/90 transition hover:text-white">VK Mini App</Link>
          <Link href="/quiz" className="ml-2">
            <button className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(124,58,237,0.25)] transition hover:brightness-110">Начать подбор</button>
          </Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-3 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-white shadow-[0_18px_40px_rgba(15,23,42,0.32)]"
            aria-label="Открыть меню"
          >
            <span className="block h-0.5 w-5 rounded-full bg-white" />
            <span className="block h-0.5 w-5 rounded-full bg-white mt-1.5" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute inset-x-4 top-[84px] z-40 rounded-[28px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/quiz" className="rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">Анкета</Link>
            <Link href="/results" className="rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">Результаты</Link>
            <Link href="/vk" className="rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">VK Mini App</Link>
            <Link href="/quiz" className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white text-center shadow-[0_16px_50px_rgba(124,58,237,0.25)]">Начать подбор</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
