"use client";
import Link from 'next/link';
import React from 'react';

export default function VkHeader() {
  return (
    <header className="vk-header">
      <div className="vk-logo">
        <div className="rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] w-9 h-9 flex items-center justify-center text-sm font-bold">ЧП</div>
        <div className="vk-title">ЧтоПодарить</div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/quiz" className="vk-start-btn">Начать</Link>
      </div>
    </header>
  );
}
