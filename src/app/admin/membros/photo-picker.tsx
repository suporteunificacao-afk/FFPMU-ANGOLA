"use client";

import { useEffect, useState } from "react";
import { Camera, UserRound, X } from "lucide-react";

export function MemberPhotoPicker({ initialUrl }: { initialUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className="flex flex-col items-center gap-3">
      <label className="group relative flex h-40 w-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-amber-500 hover:bg-amber-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pré-visualização da fotografia do membro" className="h-full w-full object-cover" />
        ) : (
          <>
            <UserRound size={38} className="text-slate-400" />
            <span className="mt-2 text-xs font-semibold text-slate-600">Adicionar fotografia</span>
            <Camera size={16} className="mt-2 text-amber-700" />
          </>
        )}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
              event.target.value = "";
              window.alert("A fotografia deve ter no máximo 2 MB.");
              return;
            }
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
              event.target.value = "";
              window.alert("Escolha uma imagem JPG, PNG ou WEBP.");
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
      </label>
      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            const input = document.querySelector<HTMLInputElement>('input[name="photo"]');
            if (input) input.value = "";
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline"
        >
          <X size={14} /> Remover fotografia
        </button>
      )}
      <p className="max-w-40 text-center text-[11px] leading-4 text-slate-500">JPG, PNG ou WEBP · máximo 2 MB</p>
    </div>
  );
}
