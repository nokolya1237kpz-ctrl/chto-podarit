"use client";
import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
