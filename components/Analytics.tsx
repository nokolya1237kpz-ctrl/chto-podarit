"use client";
import { useEffect } from 'react';
import { pageView } from '../lib/metrics';
import { usePathname } from 'next/navigation';

export default function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    pageView(pathname);
  }, [pathname]);
  return null;
}
