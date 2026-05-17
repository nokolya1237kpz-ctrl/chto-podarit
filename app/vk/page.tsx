"use client";
import React, { useEffect } from 'react';
import VkHeader from '@/components/VkHeader';
import VkQuiz from '@/components/VkQuiz';

export default function VkPage() {
  useEffect(() => {
    (async () => {
      try {
        const bridge = await import('@vkontakte/vk-bridge');
        bridge.default.send('VKWebAppInit');
      } catch (e) {
        console.warn('vk-bridge not available', e);
      }
    })();
  }, []);

  return (
    <div className="vk-root">
      <VkHeader />
      <main>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div className="vk-shell-card">
            <p className="text-sm text-slate-300 mb-3">Компактная версия для VK Mini App</p>
            <VkQuiz />
          </div>
        </div>
      </main>
    </div>
  );
}
