'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackAnalyticsEvent } from '@/src/hooks/useTrackEvent';
import {
  buildMarketplaceSearchLinks,
} from '../lib/buildMarketplaceSearchLinks';

type MarketplaceSearchLinksProps = {
  query: string;
  heading?: string;
  description?: string;
  sourcePage?: string;
};

export function MarketplaceSearchLinks({
  query,
  heading = 'Проверить цену на маркетплейсах',
  description = 'Мы не всегда можем получить цены автоматически, но вы можете быстро открыть поиск этого товара на популярных площадках.',
  sourcePage = 'compare',
}: MarketplaceSearchLinksProps) {
  const [enabled, setEnabled] = useState(true);
  const links = useMemo(() => buildMarketplaceSearchLinks(query), [query]);

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.json())
      .then((data) => setEnabled(data.enableMarketplaceSearchLinks !== false))
      .catch(() => setEnabled(true));
  }, []);

  if (!enabled || !query.trim()) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-purple-300/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(15,23,42,0.88)_55%,rgba(236,72,153,0.10))] p-5 shadow-[0_20px_70px_rgba(76,29,149,0.18)] md:p-6">
      <div>
          <h2 className="text-xl font-bold text-white">{heading}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {links.map((link) => (
          <a
            key={link.marketplace}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAnalyticsEvent('marketplace_search_click', {
              query,
              marketplace: link.marketplace,
              metadata: {
                query,
                marketplace: link.marketplace,
                url: link.url,
                source_page: sourcePage,
              },
            })}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-purple-300/50 hover:bg-white/15"
          >
            Найти на {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
