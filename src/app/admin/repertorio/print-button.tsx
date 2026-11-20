"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#142b4a] hover:bg-slate-50 print:hidden"
    >
      Imprimir página
    </button>
  );
}
