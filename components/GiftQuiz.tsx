"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizAnswers, Recipient, Budget, Occasion, Interest, GiftType } from '../types/gift';
import { event } from '../lib/metrics';

const recipients: Recipient[] = ['Девушка','Парню','Маме','Папе','Другу','Коллеге','Ребёнку'];
const budgets: Budget[] = ['До 1000 ₽','1000–3000 ₽','3000–7000 ₽','7000–15000 ₽','15000 ₽+'];
const occasions: Occasion[] = ['День рождения','Новый год','14 февраля','8 марта','Без повода'];
const interests: Interest[] = ['Техника','Игры','Авто','Красота','Спорт','Уют','Путешествия'];
const types: GiftType[] = ['Практичный','Романтичный','Необычный','Смешной','Премиальный'];

export default function GiftQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({ recipient: '', budget: '', occasion: '', interest: '', giftType: '' });

  const steps = [
    { key: 'recipient', title: 'Кому подарок?', options: recipients },
    { key: 'budget', title: 'Бюджет', options: budgets },
    { key: 'occasion', title: 'Повод', options: occasions },
    { key: 'interest', title: 'Интересы', options: interests },
    { key: 'giftType', title: 'Тип подарка', options: types }
  ];

  const selectedValue = answers[steps[step].key as keyof QuizAnswers];
  const progress = ((step + 1) / steps.length) * 100;

  const select = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value } as QuizAnswers));
  };

  const next = () => {
    if (!selectedValue) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = (eventForm?: React.FormEvent) => {
    eventForm?.preventDefault();
    if (!selectedValue) return;
    const params = new URLSearchParams();
    Object.entries(answers).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      event('quiz_submit', { answers });
    } catch (err) {
      // ignore analytics failures
    }

    router.push('/results?' + params.toString());
  };

  const current = steps[step];

  return (
    <form onSubmit={submit} className="w-full mx-auto max-w-2xl rounded-[2.5rem] border border-white/11 bg-gradient-to-br from-white/6 to-white/4 p-7 sm:p-8 shadow-[0_40px_120px_rgba(15,23,42,0.38)] backdrop-blur-2xl text-white inner-glow">
      <div className="mb-8">
        <div className="progress-rail mb-5 overflow-hidden rounded-full">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Шаг {step + 1} из {steps.length}</span>
          <span className="text-purple-300">{selectedValue ? `Выбрано: ${selectedValue}` : 'Выберите вариант'}</span>
        </div>
      </div>

      <div className="mb-9">
        <h2 className="text-3xl font-bold mb-3 text-white">{current.title}</h2>
        <p className="text-sm text-slate-400 leading-6">Выберите один подходящий вариант — это поможет точнее подобрать подарок.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-9">
        {current.options.map((option) => {
          const active = selectedValue === option;
          return (
            <button
              type="button"
              key={option}
              onClick={() => select(current.key, option)}
              className={`rounded-[1.75rem] border px-5 py-4 text-left text-sm font-medium transition duration-300 ${active ? 'border-white/16 bg-gradient-to-r from-purple-500/20 to-pink-500/15 text-white shadow-[0_24px_90px_rgba(124,58,237,0.22)]' : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/14 hover:bg-slate-950/70 hover:text-slate-200'}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-white/9 hover:border-white/16 disabled:cursor-not-allowed disabled:opacity-40 backdrop-blur-sm"
        >
          Назад
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!selectedValue}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(124,58,237,0.32)] transition hover:brightness-110 hover:shadow-[0_28px_120px_rgba(124,58,237,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Далее
          </button>
        ) : (
          <button
            type="submit"
            disabled={!selectedValue}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(124,58,237,0.32)] transition hover:brightness-110 hover:shadow-[0_28px_120px_rgba(124,58,237,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Показать идеи
          </button>
        )}
      </div>
    </form>
  );
}
