import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import type { Product } from '@/types/product';

export default function GiftSeoPage({ title, description, products }: { title: string; description: string; products: Product[] }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Gift guide</p>
          <h1 className="mt-3 text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">{description}</p>
          <a href="/quiz" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3 font-semibold">Пройти анкету</a>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {products.map((product) => <GiftCard key={product.id} gift={product} />)}
        </section>
      </main>
      <Footer />
    </div>
  );
}
