"use client";
import React, { useEffect, useRef } from 'react';

type Props = { path: string; loop?: boolean; autoplay?: boolean; className?: string };

export default function LottiePlayer({ path, loop = true, autoplay = true, className = '' }: Props) {
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let anim: any = null;
    let mounted = true;
    (async () => {
      try {
        const lottie = (await import('lottie-web')) as any;
        if (!mounted || !el.current) return;
        anim = lottie.loadAnimation({ container: el.current, renderer: 'svg', loop, autoplay, path });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Lottie failed to load', e);
      }
    })();
    return () => { mounted = false; if (anim) anim.destroy(); };
  }, [path, loop, autoplay]);

  return <div ref={el} className={className} />;
}
