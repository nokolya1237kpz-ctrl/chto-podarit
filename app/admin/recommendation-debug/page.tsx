'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function RecommendationDebugPage() {
  const [recipient, setRecipient] = useState('девушке');
  const [occasion, setOccasion] = useState('8 марта');
  const [budget, setBudget] = useState('1000–3000 ₽');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function runDebug() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/recommendation-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, occasion, budget, interests }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Диагностика не выполнена');
        return;
      }
      setResult(data);
    } catch {
      setError('Ошибка запроса диагностики');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Диагностика рекомендаций">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <input value={recipient} onChange={(event) => setRecipient(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Получатель" />
            <input value={occasion} onChange={(event) => setOccasion(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Повод" />
            <input value={budget} onChange={(event) => setBudget(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Бюджет" />
            <input value={interests} onChange={(event) => setInterests(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" placeholder="Интересы через запятую" />
          </div>
          <button onClick={runDebug} disabled={loading} className="mt-4 rounded-2xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? 'Проверяем...' : 'Проверить выдачу'}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
        </div>

        {result ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-emerald-300/15 bg-emerald-500/10 p-5">
              <h2 className="font-semibold text-white">Топ выдачи</h2>
              <div className="mt-4 space-y-3">
                {result.topResults.map((item: any) => (
                  <div key={item.id} className="rounded-2xl bg-slate-950/70 p-3 text-sm text-slate-200">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.price} ₽ • {item.categorySlug} • {item.detectedGender} • score {item.score}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.reasons.map((reason: string) => <span key={reason} className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs text-emerald-100">{reason}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-rose-300/15 bg-rose-500/10 p-5">
              <h2 className="font-semibold text-white">Заблокированные примеры</h2>
              <div className="mt-4 space-y-3">
                {result.blockedExamples.map((item: any) => (
                  <div key={item.id} className="rounded-2xl bg-slate-950/70 p-3 text-sm text-slate-200">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.price} ₽ • {item.categorySlug} • {item.detectedGender}</div>
                    <div className="mt-2 text-xs text-rose-100">{item.penalties.join(', ')}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
