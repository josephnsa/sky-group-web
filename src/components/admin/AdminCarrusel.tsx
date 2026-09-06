import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import {
  carruselAdmin,
  subirImagen,
  type CarouselSlideAdmin,
} from "../../lib/supabase-admin";

export default function AdminCarrusel() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  const [slides, setSlides] = useState<CarouselSlideAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [enlace, setEnlace] = useState("");
  // id !== null mientras se edita una diapositiva existente en vez de crear
  // una nueva — mismo patrón ya usado en Productos y Categorías.
  const [editando, setEditando] = useState<CarouselSlideAdmin | null>(null);

  async function cargar() {
    setCargando(true);
    setSlides(await carruselAdmin.listar());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function elegirArchivo(f: File | null) {
    setArchivo(f);
    setPrevia(f ? URL.createObjectURL(f) : null);
  }

  function editar(slide: CarouselSlideAdmin) {
    setEditando(slide);
    setArchivo(null);
    setPrevia(null);
    setEnlace(slide.enlace ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditando(null);
    elegirArchivo(null);
    setEnlace("");
    (document.getElementById("form-carrusel") as HTMLFormElement)?.reset();
  }

  async function guardar(e: Event) {
    e.preventDefault();
    if (!editando && !archivo) return;
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        const cambios: Partial<CarouselSlideAdmin> = { enlace: enlace.trim() || null };
        // La imagen solo se reemplaza si se eligió un archivo nuevo — si no,
        // se deja la que ya tenía.
        if (archivo) cambios.imagen_url = await subirImagen(archivo, "carrusel");
        await carruselAdmin.actualizar(editando.id, cambios);
      } else {
        const imagen_url = await subirImagen(archivo!, "carrusel");
        await carruselAdmin.crear({
          imagen_url,
          titulo: null,
          enlace: enlace.trim() || null,
          orden: slides.length,
          activo: true,
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

  async function alternarActivo(slide: CarouselSlideAdmin) {
    await carruselAdmin.actualizar(slide.id, { activo: !slide.activo });
    await cargar();
  }

  async function mover(slide: CarouselSlideAdmin, direccion: -1 | 1) {
    const ordenados = [...slides].sort((a, b) => a.orden - b.orden);
    const i = ordenados.findIndex((s) => s.id === slide.id);
    const j = i + direccion;
    if (j < 0 || j >= ordenados.length) return;
    // Intercambia el `orden` de los dos vecinos — más simple que
    // renumerar toda la lista, y el resultado visual es el mismo.
    const vecino = ordenados[j];
    await Promise.all([
      carruselAdmin.actualizar(slide.id, { orden: vecino.orden }),
      carruselAdmin.actualizar(vecino.id, { orden: slide.orden }),
    ]);
    await cargar();
  }

  async function borrar(slide: CarouselSlideAdmin) {
    if (!confirm("¿Borrar esta imagen del carrusel?")) return;
    await carruselAdmin.borrar(slide.id);
    await cargar();
  }

  const slidesOrdenados = [...slides].sort((a, b) => a.orden - b.orden);

  return (
    <div class="space-y-8">
      <form id="form-carrusel" onSubmit={guardar} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-white">
            {editando ? "Reemplazar imagen" : "Agregar imagen al carrusel"}
          </h2>
          {editando && (
            <button type="button" onClick={cancelarEdicion} class="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
              Cancelar
            </button>
          )}
        </div>

        {/* Vista previa: la imagen ya elegida (si acabás de seleccionar un
        archivo nuevo) o la que ya tiene guardada esta diapositiva (si estás
        editando) — para que quede clarísimo qué se va a subir/reemplazar,
        todo dentro del mismo formulario, sin ningún campo de URL. */}
        {(previa || editando?.imagen_url) && (
          <img
            src={previa ?? editando!.imagen_url}
            alt=""
            class="h-32 w-full rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
          />
        )}

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="imagen-carrusel">
            {editando ? "Subir una imagen nueva (opcional)" : "Imagen"}
          </label>
          <input
            id="imagen-carrusel"
            type="file"
            accept="image/*"
            required={!editando}
            onChange={(e) => elegirArchivo((e.target as HTMLInputElement).files?.[0] ?? null)}
            class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recomendado: 2400×900px o similar, panorámica (aprox. 2.6:1 de ancho a alto) —
            así se ve completa en el carrusel, sin recortes ni barras de color. Admite
            JPG, PNG, WebP o GIF (los GIF se muestran animados tal cual).
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="enlace-carrusel">
            Botón "Ver todo" hacia (opcional)
          </label>
          <input
            id="enlace-carrusel"
            type="text"
            placeholder="/catalogo/iluminacion"
            value={enlace}
            onInput={(e) => setEnlace((e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Si completás esto, aparece un botón "Ver todo" sobre la imagen que lleva a esa
            página al hacer clic — por ejemplo, subí una foto de Iluminación y poné
            <code class="mx-1 rounded bg-neutral-100 px-1 dark:bg-neutral-800">/catalogo/iluminacion</code>
            para que el botón lleve directo a esa categoría. Dejalo vacío para que la imagen
            se muestre sola, sin ningún botón encima.
          </p>
        </div>

        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar imagen"}
        </button>
      </form>

      <div>
        <h2 class="mb-1 font-semibold text-neutral-900 dark:text-white">Imágenes actuales</h2>
        <p class="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          El número redondo indica el orden — la <strong>1</strong> es la primera que se ve al
          cargar la página. Usá ▲▼ para reordenar.
        </p>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : slidesOrdenados.length === 0 ? (
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Todavía no hay ninguna.</p>
        ) : (
          <ul class="space-y-3">
            {slidesOrdenados.map((s, i) => (
              <li key={s.id} class={`flex items-center gap-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${s.activo ? "" : "opacity-60"}`}>
                <span
                  class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white"
                  title={`Diapositiva ${i + 1} de ${slidesOrdenados.length}`}
                >
                  {i + 1}
                </span>
                <img src={s.imagen_url} alt="" class="h-16 w-28 flex-none rounded-md object-cover" />
                <div class="min-w-0 flex-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {s.enlace ? (
                    <span>
                      Botón "Ver todo" → <span class="text-neutral-700 dark:text-neutral-300">{s.enlace}</span>
                    </span>
                  ) : (
                    <span class="italic">Solo imagen, sin botón</span>
                  )}
                </div>
                <div class="flex flex-col">
                  <button
                    type="button"
                    onClick={() => mover(s, -1)}
                    disabled={i === 0}
                    aria-label="Mover antes"
                    class="text-neutral-500 disabled:opacity-30 dark:text-neutral-400"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(s, 1)}
                    disabled={i === slidesOrdenados.length - 1}
                    aria-label="Mover después"
                    class="text-neutral-500 disabled:opacity-30 dark:text-neutral-400"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => alternarActivo(s)}
                  class={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    s.activo
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {s.activo ? "Activa" : "Inactiva"}
                </button>
                <button
                  type="button"
                  onClick={() => editar(s)}
                  class="shrink-0 text-sm text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => borrar(s)}
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
