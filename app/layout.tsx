import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Analytics from '../components/Analytics';
import Providers from '../components/Providers';

export const metadata: Metadata = {
  title: 'ЧтоПодарить — подбор подарка за 30 секунд',
  description: 'Быстрый подбор подарков по бюджету, интересам и поводу.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Script
          id="yandex-metrika"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109471724', 'ym');

              ym(109471724, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
            `,
          }}
        />
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/109471724" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
