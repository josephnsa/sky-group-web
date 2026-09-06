import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import {
  categoriasAdmin,
  subirImagen,
  type CategoriaAdmin,
} from "../../lib/supabase-admin";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategorias() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  // slug !== null mientras se edita una categoría existente — el nombre no
  // se puede cambiar en edición (cambiaría el slug y rompería los productos
  // que ya apuntan a él), solo la foto.
  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setCategorias(await categoriasAdmin.listar());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function editar(cat: CategoriaAdmin) {
    setEditandoSlug(cat.slug);
    setNombre(cat.nombre);
    setArchivo(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoSlug(null);
    setNombre("");
    setArchivo(null);
    (document.getElementById("form-categoria") as HTMLFormElement)?.reset();
  }

  async function guardar(e: Event) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      if (editandoSlug) {
        // El nombre (etiqueta que ve el cliente) sí se puede editar; el
        // slug (usado en la URL /catalogo/<slug> y como referencia de cada
        // producto) se queda igual a propósito, para no romper enlaces ya
        // compartidos ni tener que reasignar todos los productos.
        const cambios: Partial<CategoriaAdmin> = { nombre: nombre.trim() };
        if (archivo) cambios.foto_url = await subirImagen(archivo, "categorias");
        await categoriasAdmin.actualizar(editandoSlug, cambios);
      } else {
        const foto_url = archivo ? await subirImagen(archivo, "categorias") : null;
        await categoriasAdmin.crear({
          slug: slugify(nombre),
          nombre: nombre.trim(),
          foto_url,
          orden: categorias.length,
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

  async function alternarActivo(cat: CategoriaAdmin) {
    await categoriasAdmin.actualizar(cat.slug, { activo: !cat.activo });
    await cargar();
  }

  async function borrar(cat: CategoriaAdmin) {
    if (!confirm(`¿Borrar la categoría "${cat.nombre}"? Solo se puede si no tiene productos.`)) return;
    try {
      await categoriasAdmin.borrar(cat.slug);
      await cargar();
    } catch {
      alert("No se pudo borrar — probablemente todavía tiene productos asignados.");
    }
  }

  return (
    <div class="space-y-8">
      <form id="form-categoria" onSubmit={guardar} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-white">
            {editandoSlug ? `Editando: ${editandoSlug}` : "Agregar categoría"}
          </h2>
          {editandoSlug && (
            <button type="button" onClick={cancelarEdicion} class="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
              Cancelar edición
            </button>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="nombre-categoria">
            Nombre
          </label>
          <input
            id="nombre-categoria"
            type="text"
            required
            value={nombre}
            onInput={(e) => setNombre((e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {editandoSlug && (
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              La dirección web de esta categoría (/catalogo/{editandoSlug}) no cambia aunque
              edites el nombre — así no se rompe ningún enlace ya compartido.
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="foto-categoria">
            Foto {editandoSlug && "(opcional — dejá vacío para mantener la actual)"}
          </label>
          <input
            id="foto-categoria"
            type="file"
            accept="image/*"
            onChange={(e) => setArchivo((e.target as HTMLInputElement).files?.[0] ?? null)}
            class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recomendado: cuadrada, mínimo 500×500px — se muestra recortada en un círculo.
          </p>
        </div>

        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : editandoSlug ? "Guardar cambios" : "Agregar categoría"}
        </button>
      </form>

      <div>
        <h2 class="mb-3 font-semibold text-neutral-900 dark:text-white">Categorías actuales</h2>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : (
          <ul class="space-y-3">
            {categorias.map((c) => (
              <li key={c.slug} class={`flex items-center gap-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${c.activo ? "" : "opacity-60"}`}>
                {c.foto_url ? (
                  <img src={c.foto_url} alt="" class="h-14 w-14 flex-none rounded-full object-cover" />
                ) : (
                  <div class="h-14 w-14 flex-none rounded-full bg-neutral-200 dark:bg-neutral-800" />
                )}
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">{c.nombre}</p>
                  <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">/{c.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => alternarActivo(c)}
                  class={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    c.activo
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {c.activo ? "Activa" : "Inactiva"}
                </button>
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
