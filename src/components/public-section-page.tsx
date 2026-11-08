import Link from "next/link";

type PublicSectionPageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  items: { title: string; description: string }[];
};

export function PublicSectionPage({ eyebrow, title, introduction, items }: PublicSectionPageProps) {
  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-extrabold tracking-[.12em] text-[#142b4a]">FFPMU ANGOLA</Link>
          <Link href="/login" className="rounded-full bg-[#142b4a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#203e64]">Entrar no sistema</Link>
        </div>
      </header>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Link href="/" className="text-sm font-medium text-[#9a702f] hover:underline">← Página inicial</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#a87930]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#142b4a] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{introduction}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7">
              <span className="text-xs font-bold tracking-[.18em] text-[#b38335]">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-xl font-semibold text-[#142b4a]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:px-8 md:flex-row md:justify-between">
          <span className="font-bold tracking-[.12em] text-[#142b4a]">FFPMU ANGOLA</span>
          <span>Fé · Comunidade · Serviço</span>
          <span>Portal institucional</span>
        </div>
      </footer>
    </main>
  );
}
