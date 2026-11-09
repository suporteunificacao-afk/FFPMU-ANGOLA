import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addSongToRepertoire, archiveSong, createRepertoire, createSong, moveRepertoireItem,
  removeSongFromRepertoire, updateRepertoire, updateRepertoireItem, updateSong,
} from "./actions";
import PrintButton from "./print-button";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";
const secondary = "rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50";

type SearchParams = {
  q?: string; songCreated?: string; songUpdated?: string; songArchived?: string;
  repertoireCreated?: string; repertoireUpdated?: string; songAdded?: string;
  itemUpdated?: string; songRemoved?: string; orderUpdated?: string; error?: string;
};

export default async function RepertoirePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const safeQuery = query.replace(/[,%()]/g, " ");
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles")
    .select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let songsQuery = supabase.from("songs")
    .select("id,title,artist_or_composer,original_key,category,lyrics,reference_url,notes,is_active,created_at")
    .eq("church_id", profile.church_id);
  let allSongsQuery = supabase.from("songs")
    .select("id,title,artist_or_composer,original_key,is_active")
    .eq("church_id", profile.church_id);
  let servicesQuery = supabase.from("church_services")
    .select("id,title,service_type,service_date,start_time")
    .eq("church_id", profile.church_id);
  let repertoiresQuery = supabase.from("repertoires")
    .select("id,title,service_id,notes,is_favorite,created_at")
    .eq("church_id", profile.church_id);

  if (profile.branch_id) {
    songsQuery = songsQuery.eq("branch_id", profile.branch_id);
    allSongsQuery = allSongsQuery.eq("branch_id", profile.branch_id);
    servicesQuery = servicesQuery.eq("branch_id", profile.branch_id);
    repertoiresQuery = repertoiresQuery.eq("branch_id", profile.branch_id);
  } else {
    songsQuery = songsQuery.is("branch_id", null);
    allSongsQuery = allSongsQuery.is("branch_id", null);
    servicesQuery = servicesQuery.is("branch_id", null);
    repertoiresQuery = repertoiresQuery.is("branch_id", null);
  }

  if (query) songsQuery = songsQuery.or(
    "title.ilike.%" + safeQuery + "%,artist_or_composer.ilike.%" + safeQuery + "%,category.ilike.%" + safeQuery + "%"
  );

  const [
    { data: songs, error: songsError },
    { data: allSongs },
    { data: services },
    { data: repertoires, error: repertoiresError },
  ] = await Promise.all([
    songsQuery.order("title", { ascending: true }).limit(300),
    allSongsQuery.order("title", { ascending: true }).limit(500),
    servicesQuery.order("service_date", { ascending: false }).limit(100),
    repertoiresQuery.order("created_at", { ascending: false }).limit(100),
  ]);

  const repertoireIds = (repertoires ?? []).map(item => item.id);
  const { data: itemRows, error: itemsError } = repertoireIds.length
    ? await supabase.from("repertoire_items")
      .select("id,repertoire_id,song_id,performed_key,notes,display_order")
      .eq("church_id", profile.church_id).in("repertoire_id", repertoireIds)
      .order("display_order", { ascending: true })
    : { data: [], error: null };

  const songById = new Map((allSongs ?? []).map(song => [song.id, song]));
  const serviceById = new Map((services ?? []).map(service => [service.id, service]));
  const itemsByRepertoire = new Map<string, NonNullable<typeof itemRows>>();
  (itemRows ?? []).forEach(item => {
    itemsByRepertoire.set(item.repertoire_id, [...(itemsByRepertoire.get(item.repertoire_id) ?? []), item]);
  });

  const successMessages = [
    [params.songCreated, "Música adicionada à biblioteca com sucesso."],
    [params.songUpdated, "Dados da música actualizados com sucesso."],
    [params.songArchived, "Música arquivada. O histórico dos repertórios foi preservado."],
    [params.repertoireCreated, "Repertório criado com sucesso."],
    [params.repertoireUpdated, "Repertório actualizado com sucesso."],
    [params.songAdded, "Música adicionada ao repertório."],
    [params.itemUpdated, "Tonalidade e observações actualizadas."],
    [params.songRemoved, "Música removida deste repertório."],
    [params.orderUpdated, "Ordem das músicas actualizada."],
  ] as const;

  return <main className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-amber-700">Ministério de Louvor</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Repertório musical</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Organize a biblioteca de músicas, prepare repertórios para os cultos e consulte as escolhas anteriores da equipa.
        </p>
      </div>
      <PrintButton />
    </header>

    {successMessages.map(([active, message], index) => active ? (
      <p key={index} role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
    ) : null)}
    {params.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      {params.error === "invalid" ? "Verifique os campos obrigatórios e os dados introduzidos."
        : params.error === "duplicate" ? "Esta música já faz parte do repertório seleccionado."
        : params.error === "service" ? "O culto ou serviço seleccionado não pertence à congregação da sua conta."
        : params.error === "order" ? "Não foi possível alterar a ordem. Actualize a página e tente novamente."
        : "Não foi possível guardar a operação. Verifique as permissões e tente novamente."}
    </p>}

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#142b4a]">Biblioteca de músicas</h2>
          <p className="text-sm text-slate-500">{songs?.length ?? 0} música(s) apresentada(s)</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={query} placeholder="Pesquisar título, artista ou categoria" className={field + " w-72"} />
          <button className={secondary}>Pesquisar</button>
        </form>
      </div>

      {songsError ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar a biblioteca. Confirme se tem a permissão de consulta musical.</p>
        : songs?.length ? <div className="grid gap-3 md:grid-cols-2">
          {songs.map(song => <article key={song.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#142b4a]">{song.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{song.artist_or_composer || "Artista/compositor não indicado"}</p>
              </div>
              <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (song.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                {song.is_active ? "Activa" : "Arquivada"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              {song.original_key && <span className="rounded-full bg-slate-100 px-2.5 py-1">Tom original: {song.original_key}</span>}
              {song.category && <span className="rounded-full bg-slate-100 px-2.5 py-1">{song.category}</span>}
              {song.reference_url && <a href={song.reference_url} target="_blank" rel="noreferrer" className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800 hover:underline">Abrir referência ↗</a>}
            </div>
            <details className="mt-4 border-t border-slate-100 pt-3">
              <summary className="cursor-pointer text-sm font-semibold text-blue-800">Editar dados da música</summary>
              <form action={updateSong} className="mt-3 grid gap-3">
                <input type="hidden" name="song_id" value={song.id} />
                <label className="text-xs font-medium text-slate-700">Nome da música<input name="title" required minLength={2} maxLength={180} defaultValue={song.title} className={field + " mt-1"} /></label>
                <label className="text-xs font-medium text-slate-700">Artista ou compositor<input name="artist_or_composer" maxLength={180} defaultValue={song.artist_or_composer ?? ""} className={field + " mt-1"} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700">Tom original<input name="original_key" maxLength={12} defaultValue={song.original_key ?? ""} placeholder="Ex.: Dó (C)" className={field + " mt-1"} /></label>
                  <label className="text-xs font-medium text-slate-700">Categoria<input name="category" maxLength={100} defaultValue={song.category ?? ""} placeholder="Ex.: Adoração" className={field + " mt-1"} /></label>
                </div>
                <label className="text-xs font-medium text-slate-700">Letra (apenas quando houver autorização)<textarea name="lyrics" maxLength={30000} rows={4} defaultValue={song.lyrics ?? ""} className={field + " mt-1"} /></label>
                <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" name="lyrics_authorized" defaultChecked={Boolean(song.lyrics)} className="mt-0.5" /> Confirmo que a igreja tem autorização para armazenar e utilizar esta letra.</label>
                <label className="text-xs font-medium text-slate-700">Link de referência (HTTPS)<input name="reference_url" type="url" defaultValue={song.reference_url ?? ""} className={field + " mt-1"} /></label>
                <label className="text-xs font-medium text-slate-700">Observações<textarea name="notes" maxLength={2000} rows={2} defaultValue={song.notes ?? ""} className={field + " mt-1"} /></label>
                <button className={button}>Guardar alterações</button>
              </form>
              {song.is_active && <form action={archiveSong} className="mt-2">
                <input type="hidden" name="song_id" value={song.id} />
                <button className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">Arquivar música</button>
              </form>}
            </details>
          </article>)}
        </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {query ? "Não foram encontradas músicas para esta pesquisa." : "A biblioteca ainda está vazia. Adicione a primeira música para começar."}
        </div>}

      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer list-none font-semibold text-blue-800">＋ Adicionar música à biblioteca</summary>
        <form action={createSong} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nome da música *<input name="title" required minLength={2} maxLength={180} placeholder="Título da música" className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700">Artista ou compositor<input name="artist_or_composer" maxLength={180} className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700">Tom original<input name="original_key" maxLength={12} placeholder="Ex.: Sol (G)" className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700">Categoria<input name="category" maxLength={100} placeholder="Ex.: Louvor, adoração, comunhão" className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700">Link de referência (HTTPS)<input name="reference_url" type="url" placeholder="https://" className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Letra (opcional; apenas com autorização)<textarea name="lyrics" maxLength={30000} rows={4} className={field + " mt-1"} /></label>
          <label className="flex items-start gap-2 text-xs text-slate-600 sm:col-span-2"><input type="checkbox" name="lyrics_authorized" className="mt-0.5" /> Confirmo que a igreja tem autorização para armazenar e utilizar esta letra.</label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Observações<textarea name="notes" maxLength={2000} rows={2} className={field + " mt-1"} /></label>
          <div className="sm:col-span-2"><button className={button}>Guardar música</button></div>
        </form>
      </details>
    </section>

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#142b4a]">Repertórios dos cultos</h2>
        <p className="text-sm text-slate-500">Crie listas de músicas para cada culto ou guarde repertórios favoritos para reutilizar.</p>
      </div>
      {repertoiresError || itemsError ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar os repertórios ou as suas músicas.</p>
        : repertoires?.length ? <div className="space-y-4">
          {repertoires.map(repertoire => {
            const rows = itemsByRepertoire.get(repertoire.id) ?? [];
            const service = repertoire.service_id ? serviceById.get(repertoire.service_id) : null;
            return <article key={repertoire.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#142b4a]">{repertoire.title}</h3>
                    {repertoire.is_favorite && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Favorito</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{service ? service.title + " · " + new Date(service.service_date + "T12:00:00").toLocaleDateString("pt-AO") : "Repertório livre / modelo"}</p>
                </div>
                <span className="text-xs text-slate-500">{rows.length} música(s)</span>
              </div>
              {rows.length ? <ol className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                {rows.map((item, index) => {
                  const song = songById.get(item.song_id);
                  return <li key={item.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#142b4a]">{song?.title ?? "Música do histórico"}</p>
                        <p className="text-xs text-slate-500">{song?.artist_or_composer ?? ""}{item.performed_key ? " · Tom utilizado: " + item.performed_key : ""}</p>
                        <form action={updateRepertoireItem} className="mt-2 flex flex-wrap gap-2">
                          <input type="hidden" name="item_id" value={item.id} />
                          <input name="performed_key" maxLength={12} defaultValue={item.performed_key ?? ""} placeholder="Tom utilizado" aria-label="Tom utilizado" className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                          <input name="notes" maxLength={1000} defaultValue={item.notes ?? ""} placeholder="Observações" aria-label="Observações" className="min-w-32 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
                          <button className={secondary}>Guardar</button>
                        </form>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <form action={moveRepertoireItem}><input type="hidden" name="repertoire_id" value={repertoire.id} /><input type="hidden" name="item_id" value={item.id} /><input type="hidden" name="direction" value="up" /><button className={secondary} disabled={index === 0} aria-label="Mover para cima">↑</button></form>
                      <form action={moveRepertoireItem}><input type="hidden" name="repertoire_id" value={repertoire.id} /><input type="hidden" name="item_id" value={item.id} /><input type="hidden" name="direction" value="down" /><button className={secondary} disabled={index === rows.length - 1} aria-label="Mover para baixo">↓</button></form>
                      <form action={removeSongFromRepertoire}><input type="hidden" name="item_id" value={item.id} /><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Remover</button></form>
                    </div>
                  </li>;
                })}
              </ol> : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Ainda não foram adicionadas músicas a este repertório.</p>}

              <details className="mt-4 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-blue-800">＋ Adicionar música a este repertório</summary>
                <form action={addSongToRepertoire} className="mt-3 grid gap-3 sm:grid-cols-3">
                  <input type="hidden" name="repertoire_id" value={repertoire.id} />
                  <label className="text-sm text-slate-700 sm:col-span-2">Música<select name="song_id" required defaultValue="" className={field + " mt-1"}><option value="" disabled>Seleccione uma música</option>{(allSongs ?? []).filter(song => song.is_active).map(song => <option key={song.id} value={song.id}>{song.title}{song.artist_or_composer ? " · " + song.artist_or_composer : ""}</option>)}</select></label>
                  <label className="text-sm text-slate-700">Tom utilizado<input name="performed_key" maxLength={12} placeholder="Ex.: Ré (D)" className={field + " mt-1"} /></label>
                  <label className="text-sm text-slate-700 sm:col-span-3">Observações<input name="notes" maxLength={1000} placeholder="Opcional" className={field + " mt-1"} /></label>
                  <div className="sm:col-span-3"><button className={button} disabled={!allSongs?.some(song => song.is_active)}>Adicionar ao repertório</button></div>
                </form>
              </details>
              <details className="mt-3 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-600">Editar repertório</summary>
                <form action={updateRepertoire} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="repertoire_id" value={repertoire.id} />
                  <label className="text-sm text-slate-700">Nome<input name="title" required minLength={2} maxLength={180} defaultValue={repertoire.title} className={field + " mt-1"} /></label>
                  <label className="text-sm text-slate-700">Culto ou serviço<select name="service_id" defaultValue={repertoire.service_id ?? ""} className={field + " mt-1"}><option value="">Sem culto associado</option>{(services ?? []).map(service => <option key={service.id} value={service.id}>{service.title} · {new Date(service.service_date + "T12:00:00").toLocaleDateString("pt-AO")}</option>)}</select></label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="is_favorite" defaultChecked={repertoire.is_favorite} /> Guardar como favorito</label>
                  <label className="text-sm text-slate-700 sm:col-span-2">Observações<textarea name="notes" maxLength={2000} rows={2} defaultValue={repertoire.notes ?? ""} className={field + " mt-1"} /></label>
                  <div className="sm:col-span-2"><button className={button}>Guardar repertório</button></div>
                </form>
              </details>
            </article>;
          })}
        </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Ainda não existem repertórios. Crie um para começar a preparar os cultos.</div>}

      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer list-none font-semibold text-blue-800">＋ Criar repertório</summary>
        <form action={createRepertoire} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Nome do repertório *<input name="title" required minLength={2} maxLength={180} placeholder="Ex.: Culto de Domingo" className={field + " mt-1"} /></label>
          <label className="text-sm font-medium text-slate-700">Associar a culto ou serviço<select name="service_id" defaultValue="" className={field + " mt-1"}><option value="">Repertório livre / modelo</option>{(services ?? []).map(service => <option key={service.id} value={service.id}>{service.title} · {new Date(service.service_date + "T12:00:00").toLocaleDateString("pt-AO")}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="is_favorite" /> Guardar como repertório favorito</label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Observações<textarea name="notes" maxLength={2000} rows={2} className={field + " mt-1"} /></label>
          <div className="sm:col-span-2"><button className={button}>Criar repertório</button></div>
        </form>
      </details>
    </section>
  </main>;
}
