"use client";
import React, { useEffect, useRef } from 'react';

export default function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
