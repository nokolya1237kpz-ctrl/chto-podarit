"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { event } from '@/lib/metrics';

const recipients = ['Девушка','Парню','Маме','Папе','Другу','Коллеге','Ребёнку'];
const budgets = ['До 1000 ₽','1000–3000 ₽','3000–7000 ₽','7000–15000 ₽','15000 ₽+'];
const occasions = ['День рождения','Новый год','14 февраля','8 марта','Без повода'];
const interests = ['Техника','Игры','Авто','Красота','Спорт','Уют','Путешествия'];
const types = ['Практичный','Романтичный','Необычный','Смешной','Премиальный'];

export default function VkQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({ recipient: '', budget: '', occasion: '', interest: '', giftType: '' });

  const steps = [
    { key: 'recipient', title: 'Кому подарок?', options: recipients },
    { key: 'budget', title: 'Бюджет', options: budgets },
    { key: 'occasion', title: 'Повод', options: occasions },
    { key: 'interest', title: 'Интересы', options: interests },
    { key: 'giftType', title: 'Тип подарка', options: types }
  ];

  const selectedValue = answers[steps[step].key as string];
  const progress = ((step + 1) / steps.length) * 100;

  const select = (key: string, value: string) => setAnswers((prev:any) => ({ ...prev, [key]: value }));
  const next = () => { if (!selectedValue) return; setStep((s) => Math.min(s + 1, steps.length - 1)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedValue) return;
    const params = new URLSearchParams();
    Object.entries(answers).forEach(([k,v]: any) => { if (v) params.set(k, v); });
    try { event('quiz_submit', { answers }); } catch {}
    router.push('/vk/results?' + params.toString());
  };

  const current = steps[step];

  return (
    <form onSubmit={submit} className="vk-shell-card vk-quiz-card">
      <div className="mb-4">
        <div className="progress-rail mb-3 overflow-hidden rounded-full bg-white/6">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Шаг {step + 1} из {steps.length}</span>
          <span className="text-purple-300">{selectedValue ? `Выбрано: ${selectedValue}` : 'Выберите вариант'}</span>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1 text-white">{current.title}</h2>
        <p className="text-sm text-slate-400">Выберите один вариант для точного результата.</p>
      </div>

      <div className="grid gap-3 mb-4">
        {current.options.map((option) => {
          const active = selectedValue === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => select(current.key, option)}
              className={`vk-quiz-option ${active ? 'active' : 'border border-white/8 bg-slate-950/60 text-white/90'}`}>
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={prev} disabled={step === 0} className="flex-1 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">Назад</button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={next} disabled={!selectedValue} className="flex-1 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white">Далее</button>
        ) : (
          <button type="submit" disabled={!selectedValue} className="flex-1 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white">Показать идеи</button>
        )}
      </div>
    </form>
  );
}
