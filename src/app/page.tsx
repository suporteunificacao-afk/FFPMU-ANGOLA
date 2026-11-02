import Link from "next/link";
import { appConfig } from "@/lib/config";

export default function HomePage() {
  return <main className="min-h-screen bg-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <div><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-700">FFPMU Angola</p><p className="text-sm text-slate-500">Comunidade • Serviço • Fé</p></div>
      <Link href="/login" className="rounded-lg bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white">Área administrativa</Link>
    </header>
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1.2fr_.8fr] md:items-center">
      <div><p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-amber-700">Bem-vindo</p><h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-[#142b4a] md:text-6xl">Uma igreja organizada para servir melhor.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Portal institucional e plataforma integrada para apoiar a vida, a administração e o serviço da igreja.</p><Link href="/login" className="mt-9 inline-flex rounded-lg bg-[#142b4a] px-6 py-3.5 font-semibold text-white">Aceder ao sistema</Link></div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#142b4a] text-2xl text-white">✦</div><h2 className="text-xl font-semibold text-[#142b4a]">Gestão integrada</h2><p className="mt-3 leading-7 text-slate-600">Membros, ministérios, cultos, eventos e informação institucional num só lugar.</p><div className="mt-8 h-px bg-slate-200"/><p className="mt-5 text-xs uppercase tracking-widest text-slate-500">{appConfig.description}</p></div>
    </section>
    <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} FFPMU Angola</footer>
  </main>;
}
