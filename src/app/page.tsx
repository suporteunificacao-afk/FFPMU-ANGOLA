import Link from "next/link";
import { appConfig } from "@/lib/config";

const areas = [
  { number: "01", title: "Pessoas e famílias", description: "Informação organizada sobre membros, visitantes e famílias da comunidade." },
  { number: "02", title: "Serviço e liderança", description: "Departamentos, ministérios e equipas com responsabilidades bem definidas." },
  { number: "03", title: "Cultos e escalas", description: "Planeamento dos cultos e distribuição das funções de cada serviço." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="relative z-10 border-b border-slate-100 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="FFPMU Angola - Início">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#142b4a] text-lg font-bold text-[#e6c27a]">F</span>
            <span><span className="block text-sm font-extrabold tracking-[.12em] text-[#142b4a]">FFPMU ANGOLA</span><span className="block text-[10px] uppercase tracking-[.18em] text-slate-500">Fé • Comunidade • Serviço</span></span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-4 text-xs font-semibold text-slate-600 xl:flex">
            <Link href="/sobre" className="transition hover:text-[#b38335]">Sobre</Link>
            <Link href="/organizacao" className="transition hover:text-[#b38335]">Organização</Link>
            <Link href="/departamentos" className="transition hover:text-[#b38335]">Departamentos</Link>
            <Link href="/actividades" className="transition hover:text-[#b38335]">Actividades</Link>
            <Link href="/eventos-publicos" className="transition hover:text-[#b38335]">Eventos</Link>
            <Link href="/noticias" className="transition hover:text-[#b38335]">Notícias</Link>
            <Link href="/biblioteca" className="transition hover:text-[#b38335]">Biblioteca</Link>
            <Link href="/contactos" className="transition hover:text-[#b38335]">Contactos</Link>
          </nav>
          <Link href="/login" className="rounded-full bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#203e64]">Entrar no sistema <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_35%,rgba(196,154,69,.17),transparent_38%),linear-gradient(120deg,#f7f8fa_0%,#fff_58%,#f5f7fa_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e7d8bb] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] text-[#946a2c]"><span className="h-2 w-2 rounded-full bg-[#c49a45]" /> Portal institucional</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight text-[#142b4a] sm:text-6xl lg:text-7xl">Uma comunidade unida. <span className="text-[#b38335]">Um serviço organizado.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Bem-vindo ao portal da FFPMU Angola. Um espaço digital que apoia a organização da igreja, aproxima as equipas e facilita o acompanhamento das actividades.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/login" className="rounded-lg bg-[#142b4a] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#142b4a]/15 transition hover:-translate-y-0.5 hover:bg-[#203e64]">Aceder à plataforma <span aria-hidden="true">→</span></Link>
              <a href="#sobre" className="px-3 py-3 text-sm font-semibold text-[#142b4a] transition hover:text-[#b38335]">Conhecer o portal <span aria-hidden="true">↓</span></a>
            </div>
            <p className="mt-8 text-xs text-slate-500">Plataforma digital de apoio à gestão e organização da igreja.</p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] border border-[#e8dfd0]" />
            <div className="relative overflow-hidden rounded-[1.7rem] bg-[#142b4a] p-7 text-white shadow-2xl shadow-[#142b4a]/20 sm:p-9">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />
              <div className="relative">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.2em] text-[#e6c27a]">FFPMU Angola</span><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-white/70">PORTAL</span></div>
                <div className="my-14 flex justify-center"><div className="flex h-36 w-36 items-center justify-center rounded-full border border-[#d7b66f]/60 bg-white/[.04]"><div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#d7b66f]/40 text-6xl font-serif text-[#e6c27a]">F</div></div></div>
                <p className="text-center text-2xl font-semibold tracking-wide">Fé que une.</p>
                <p className="mt-2 text-center text-sm text-white/65">Organização que fortalece o serviço.</p>
                <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 text-center">
                  <div><span className="block text-lg font-semibold text-[#e6c27a]">01</span><span className="text-[10px] uppercase tracking-wider text-white/60">Comunidade</span></div>
                  <div><span className="block text-lg font-semibold text-[#e6c27a]">02</span><span className="text-[10px] uppercase tracking-wider text-white/60">Serviço</span></div>
                  <div><span className="block text-lg font-semibold text-[#e6c27a]">03</span><span className="text-[10px] uppercase tracking-wider text-white/60">Missão</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="scroll-mt-20 border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[.7fr_1.3fr] md:py-20">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b38335]">O portal</p><h2 className="mt-4 text-3xl font-semibold leading-tight text-[#142b4a] sm:text-4xl">Mais clareza na organização. Mais tempo para servir.</h2></div>
          <div className="max-w-2xl md:pt-7"><p className="text-base leading-8 text-slate-600">A plataforma reúne ferramentas de apoio à administração e à vida comunitária da igreja. A informação fica estruturada num único espaço, com acesso reservado aos utilizadores autorizados.</p><p className="mt-4 text-base leading-8 text-slate-600">Cada área foi pensada para facilitar o acompanhamento das pessoas, a coordenação das equipas e a preparação dos serviços.</p></div>
        </div>
      </section>

      <section id="areas" className="scroll-mt-20 bg-[#f6f7f9]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b38335]">Áreas da plataforma</p><h2 className="mt-4 text-3xl font-semibold text-[#142b4a] sm:text-4xl">Tudo ligado ao trabalho da igreja.</h2><p className="mt-4 leading-7 text-slate-600">Uma estrutura simples para apoiar as tarefas essenciais da comunidade.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {areas.map((area) => <article key={area.number} className="group rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-[#d8bd8d] hover:shadow-xl hover:shadow-slate-900/5"><span className="text-sm font-bold tracking-widest text-[#b38335]">{area.number}</span><h3 className="mt-8 text-xl font-semibold text-[#142b4a]">{area.title}</h3><p className="mt-3 min-h-20 text-sm leading-7 text-slate-600">{area.description}</p><Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-[#142b4a] group-hover:text-[#a87930]">Aceder à plataforma <span className="ml-2">→</span></Link></article>)}
          </div>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex flex-col justify-between gap-8 rounded-3xl bg-[#142b4a] p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e6c27a]">Acesso reservado</p><h2 className="mt-4 text-3xl font-semibold">Faça parte da organização.</h2><p className="mt-3 leading-7 text-white/70">Os utilizadores autorizados podem entrar na plataforma para gerir as actividades e informações da igreja.</p></div>
            <Link href="/login" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#e6c27a] px-7 py-4 text-sm font-bold text-[#142b4a] transition hover:bg-white">Entrar no sistema <span className="ml-3">↗</span></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between"><span className="font-bold tracking-[.12em] text-[#142b4a]">FFPMU ANGOLA</span><span>{appConfig.description}</span><span>© {new Date().getFullYear()} FFPMU Angola. Todos os direitos reservados.</span></div>
      </footer>
    </main>
  );
}
