"use client";
import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GiftQuiz from '../../components/GiftQuiz';

export default function VkPage() {
  useEffect(() => {
    // lazy import vk-bridge to avoid build errors if package absent
    (async () => {
      try {
        const bridge = await import('@vkontakte/vk-bridge');
        bridge.default.send('VKWebAppInit');
      } catch (e) {
        // package not installed — ignore
        console.warn('vk-bridge not available', e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="py-6 px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">ЧтоПодарить — VK</h1>
        <p className="text-gray-600 mb-4">Компактная версия анкеты для VK Mini App.</p>
        <GiftQuiz />
      </main>
      <Footer />
    </div>
  );
}
