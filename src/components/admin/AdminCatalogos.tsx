import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import { catalogosAdmin, subirImagen, type CatalogoAdmin } from "../../lib/supabase-admin";
import { generarMiniaturaPdf } from "../../lib/pdf-thumbnail";

export default function AdminCatalogos() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  const [catalogos, setCatalogos] = useState<CatalogoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generandoMiniatura, setGenerandoMiniatura] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [previaMiniatura, setPreviaMiniatura] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setCatalogos(await catalogosAdmin.listar());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function editar(c: CatalogoAdmin) {
    setEditandoId(c.id);
    setNombre(c.nombre);
    setDescripcion(c.descripcion);
    setArchivoPdf(null);
    setPreviaMiniatura(c.portada_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setArchivoPdf(null);
    setPreviaMiniatura(null);
    (document.getElementById("form-catalogo") as HTMLFormElement)?.reset();
  }

  // Al elegir el PDF, se genera la miniatura de la primera página al
  // instante (en el navegador, con pdf.js) para que el admin la vea antes
  // de guardar — no hace falta crearla a mano ni esperar al servidor.
  async function alElegirPdf(archivo: File | null) {
    setArchivoPdf(archivo);
    if (!archivo) return;
    setGenerandoMiniatura(true);
    setError(null);
    try {
      const miniatura = await generarMiniaturaPdf(archivo);
      setPreviaMiniatura(URL.createObjectURL(miniatura));
    } catch {
      setError("No se pudo generar la miniatura del PDF — igual se puede guardar, solo quedará sin portada.");
      setPreviaMiniatura(null);
    } finally {
      setGenerandoMiniatura(false);
    }
  }

  async function guardar(e: Event) {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) return;
    if (!editandoId && !archivoPdf) return;
    setGuardando(true);
    setError(null);
    try {
      let archivoUrl: string | undefined;
      let portadaUrl: string | undefined;
      if (archivoPdf) {
        archivoUrl = await subirImagen(archivoPdf, "catalogos");
        try {
          const miniatura = await generarMiniaturaPdf(archivoPdf);
          portadaUrl = await subirImagen(miniatura, "catalogos");
        } catch {
          // Sin miniatura — el PDF igual se guarda, solo queda sin portada.
        }
      }

      if (editandoId) {
        await catalogosAdmin.actualizar(editandoId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          ...(archivoUrl ? { archivo_url: archivoUrl } : {}),
          ...(portadaUrl ? { portada_url: portadaUrl } : {}),
        });
      } else {
        await catalogosAdmin.crear({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          archivo_url: archivoUrl!,
          portada_url: portadaUrl ?? null,
          orden: catalogos.length,
        });
      }
      cancelarEdicion();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(c: CatalogoAdmin) {
    if (!confirm(`¿Borrar el catálogo "${c.nombre}"?`)) return;
    await catalogosAdmin.borrar(c.id);
    await cargar();
  }

  return (
    <div class="space-y-8">
      <form id="form-catalogo" onSubmit={guardar} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-white">
            {editandoId ? "Editando catálogo" : "Agregar catálogo"}
          </h2>
          {editandoId && (
            <button type="button" onClick={cancelarEdicion} class="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
              Cancelar edición
            </button>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nombre</label>
          <input
            type="text"
            required
            value={nombre}
            onInput={(e) => setNombre((e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción corta</label>
          <input
            type="text"
            required
            value={descripcion}
            onInput={(e) => setDescripcion((e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Archivo PDF {editandoId && "(opcional — dejá vacío para mantener el actual)"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => alElegirPdf((e.target as HTMLInputElement).files?.[0] ?? null)}
              class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
            />
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              La miniatura de portada se genera sola a partir de la primera página del PDF.
            </p>
          </div>
          <div class="shrink-0">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Portada</label>
            {generandoMiniatura ? (
              <div class="mt-1 flex h-20 w-16 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-800">
                ...
              </div>
            ) : previaMiniatura ? (
              <img src={previaMiniatura} alt="" class="mt-1 h-20 w-16 rounded-md border border-neutral-200 object-cover dark:border-neutral-700" />
            ) : (
              <div class="mt-1 h-20 w-16 rounded-md bg-neutral-200 dark:bg-neutral-800" />
            )}
          </div>
        </div>

        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando || generandoMiniatura}
          class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar catálogo"}
        </button>
      </form>

      <div>
        <h2 class="mb-3 font-semibold text-neutral-900 dark:text-white">Catálogos actuales</h2>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : (
          <ul class="space-y-3">
            {catalogos.map((c) => (
              <li key={c.id} class="flex items-center gap-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                {c.portada_url ? (
                  <img src={c.portada_url} alt="" class="h-16 w-12 flex-none rounded-md object-cover" />
                ) : (
                  <div class="h-16 w-12 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                )}
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">{c.nombre}</p>
                  <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">{c.descripcion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => editar(c)}
                  class="shrink-0 text-sm text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => borrar(c)}
                  class="shrink-0 text-sm text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
