import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import {
  categoriasAdmin,
  productosAdmin,
  subirImagen,
  type CategoriaAdmin,
  type ProductoAdmin,
} from "../../lib/supabase-admin";

const VACIO = {
  sku: "",
  categoria_slug: "",
  subcategoria: "",
  nombre: "",
  marca: "",
  precio: "",
  precioAnterior: "",
  descripcion: "",
  destacado: false,
  compatibilidad: "",
  especificaciones: "",
};

function aFormulario(p: ProductoAdmin) {
  return {
    sku: p.sku,
    categoria_slug: p.categoria_slug,
    subcategoria: p.subcategoria,
    nombre: p.nombre,
    marca: p.marca,
    precio: p.precio != null ? String(p.precio) : "",
    precioAnterior: p.precio_anterior != null ? String(p.precio_anterior) : "",
    descripcion: p.descripcion,
    destacado: p.destacado,
    compatibilidad: (p.compatibilidad ?? []).join(", "),
    especificaciones: (p.especificaciones ?? []).map((e) => `${e.etiqueta}: ${e.valor}`).join("\n"),
  };
}

export default function AdminProductos() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Varias fotos (la primera queda como `imagen` principal, el resto como
  // galería `imagenes`) + un video opcional — mismo patrón "solo se
  // reemplaza si se elige algo nuevo" que ya tenía la foto única.
  const [archivos, setArchivos] = useState<File[]>([]);
  const [archivoVideo, setArchivoVideo] = useState<File | null>(null);
  const [form, setForm] = useState(VACIO);
  // sku !== null mientras se edita un producto existente (en vez de crear
  // uno nuevo) — el mismo formulario de abajo se reusa para ambos casos.
  const [editandoSku, setEditandoSku] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const [p, c] = await Promise.all([productosAdmin.listar(), categoriasAdmin.listar()]);
    setProductos(p);
    setCategorias(c);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function campo<K extends keyof typeof VACIO>(clave: K, valor: (typeof VACIO)[K]) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function editar(p: ProductoAdmin) {
    setEditandoSku(p.sku);
    setForm(aFormulario(p));
    setArchivos([]);
    setArchivoVideo(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoSku(null);
    setForm(VACIO);
    setArchivos([]);
    setArchivoVideo(null);
    (document.getElementById("form-producto") as HTMLFormElement)?.reset();
  }

  // "etiqueta: valor" por línea → [{etiqueta, valor}]. Formato simple a
  // propósito (sin filas dinámicas repetibles) — cubre bien la ficha técnica
  // de 2-6 líneas que ya usan los productos reales del catálogo.
  function parsearEspecificaciones(texto: string) {
    const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lineas.length === 0) return null;
    return lineas.map((linea) => {
      const [etiqueta, ...resto] = linea.split(":");
      return { etiqueta: etiqueta.trim(), valor: resto.join(":").trim() };
    });
  }

  function parsearCompatibilidad(texto: string) {
    const items = texto.split(",").map((t) => t.trim()).filter(Boolean);
    return items.length > 0 ? items : null;
  }

  async function guardar(e: Event) {
    e.preventDefault();
    if (!form.sku.trim() || !form.categoria_slug || !form.nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const datosComunes = {
        categoria_slug: form.categoria_slug,
        subcategoria: form.subcategoria.trim(),
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        precio: form.precio ? Number(form.precio) : null,
        precio_anterior: form.precioAnterior ? Number(form.precioAnterior) : null,
        descripcion: form.descripcion.trim(),
        destacado: form.destacado,
        compatibilidad: parsearCompatibilidad(form.compatibilidad),
        especificaciones: parsearEspecificaciones(form.especificaciones),
      };

      // Todas las fotos elegidas se suben en paralelo; la primera queda
      // como `imagen` principal (la que se ve en tarjetas/listados) y el
      // resto como galería (`imagenes`, la que muestra GaleriaProducto).
      const urlsFotos = archivos.length > 0 ? await Promise.all(archivos.map((a) => subirImagen(a, "productos"))) : null;
      const urlVideo = archivoVideo ? await subirImagen(archivoVideo, "productos") : null;

      if (editandoSku) {
        // Las fotos/video solo se reemplazan si se eligió algo nuevo — si
        // no, se deja lo que ya tenía (no se pisa con null). El SKU sí se
        // puede renombrar: se busca la fila por el SKU viejo (`editandoSku`)
        // y se guarda el nuevo valor de `form.sku` en el cambio.
        const cambios: Partial<ProductoAdmin> = {
          ...datosComunes,
          sku: form.sku.trim().toUpperCase(),
        };
        if (urlsFotos) {
          cambios.imagen = urlsFotos[0];
          cambios.imagenes = urlsFotos.slice(1);
        }
        if (urlVideo) cambios.video_url = urlVideo;
        await productosAdmin.actualizar(editandoSku, cambios);
      } else {
        await productosAdmin.crear({
          sku: form.sku.trim().toUpperCase(),
          imagen: urlsFotos ? urlsFotos[0] : null,
          imagenes: urlsFotos ? urlsFotos.slice(1) : null,
          video_url: urlVideo,
          activo: true,
          ...datosComunes,
        });
      }

      cancelarEdicion();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Revisá que el SKU no exista ya.");
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(p: ProductoAdmin) {
    await productosAdmin.actualizar(p.sku, { activo: !p.activo });
    await cargar();
  }

  async function borrar(p: ProductoAdmin) {
    if (!confirm(`¿Borrar "${p.nombre}" (${p.sku})? Esto no se puede deshacer — si solo quieres ocultarlo, usa "Desactivar".`)) return;
    await productosAdmin.borrar(p.sku);
    await cargar();
  }

  return (
    <div class="space-y-8">
      <form id="form-producto" onSubmit={guardar} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-neutral-900 dark:text-white">
            {editandoSku ? `Editando: ${editandoSku}` : "Agregar producto"}
          </h2>
          {editandoSku && (
            <button type="button" onClick={cancelarEdicion} class="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
              Cancelar edición
            </button>
          )}
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <Campo label="SKU" value={form.sku} onInput={(v) => campo("sku", v)} required />
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="categoria-producto">
              Categoría
            </label>
            <select
              id="categoria-producto"
              required
              value={form.categoria_slug}
              onInput={(e) => campo("categoria_slug", (e.target as HTMLSelectElement).value)}
              class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="" disabled>
                Elegir categoría
              </option>
              {categorias.map((c) => (
                <option value={c.slug}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <Campo label="Subcategoría" value={form.subcategoria} onInput={(v) => campo("subcategoria", v)} required />
          <Campo label="Nombre" value={form.nombre} onInput={(v) => campo("nombre", v)} required />
          <Campo label="Marca" value={form.marca} onInput={(v) => campo("marca", v)} required />
          <Campo
            label="Precio (S/, opcional — si no se carga, se muestra 'Cotiza por WhatsApp')"
            type="number"
            value={form.precio}
            onInput={(v) => campo("precio", v)}
          />
          <Campo
            label="Precio anterior (S/, opcional — si hay descuento)"
            type="number"
            value={form.precioAnterior}
            onInput={(v) => campo("precioAnterior", v)}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="descripcion-producto">
            Descripción
          </label>
          <textarea
            id="descripcion-producto"
            required
            rows={3}
            value={form.descripcion}
            onInput={(e) => campo("descripcion", (e.target as HTMLTextAreaElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="compatibilidad-producto">
            Modelos compatibles (opcional, separados por coma)
          </label>
          <input
            id="compatibilidad-producto"
            type="text"
            placeholder="Toyota Yaris 2015-2021, Kia Rio 2017-2022"
            value={form.compatibilidad}
            onInput={(e) => campo("compatibilidad", (e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="especificaciones-producto">
            Ficha técnica (opcional, una línea por dato: etiqueta: valor)
          </label>
          <textarea
            id="especificaciones-producto"
            rows={3}
            placeholder={"Voltaje: 12V\nContenido: Par (2 unidades)"}
            value={form.especificaciones}
            onInput={(e) => campo("especificaciones", (e.target as HTMLTextAreaElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="imagenes-producto">
            Fotos del producto (podés elegir varias) {editandoSku && "— opcional, dejá vacío para mantener las actuales"}
          </label>
          <input
            id="imagenes-producto"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setArchivos(Array.from((e.target as HTMLInputElement).files ?? []))}
            class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recomendado: cuadradas, mínimo 600×600px, fondo blanco o transparente. La
            primera foto elegida es la principal (la que se ve en el catálogo); el resto
            arma la galería de la ficha del producto. Si no subís ninguna, se muestra una
            imagen genérica del rubro mientras tanto.
            {archivos.length > 0 && ` (${archivos.length} foto${archivos.length !== 1 ? "s" : ""} elegida${archivos.length !== 1 ? "s" : ""})`}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="video-producto">
            Video del producto (opcional) {editandoSku && "— dejá vacío para mantener el actual"}
          </label>
          <input
            id="video-producto"
            type="file"
            accept="video/*"
            onChange={(e) => setArchivoVideo((e.target as HTMLInputElement).files?.[0] ?? null)}
            class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Formato MP4, lo más liviano posible (idealmente menos de 20 MB) para que cargue
            rápido en celular. Aparece junto a las fotos en la ficha del producto.
            {archivoVideo && ` (video elegido: ${archivoVideo.name})`}
          </p>
        </div>

        <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={form.destacado}
            onChange={(e) => campo("destacado", (e.target as HTMLInputElement).checked)}
          />
          Mostrar en "Productos destacados" de Home
        </label>

        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : editandoSku ? "Guardar cambios" : "Agregar producto"}
        </button>
      </form>

      <div>
        <h2 class="mb-3 font-semibold text-neutral-900 dark:text-white">Productos actuales ({productos.length})</h2>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : (
          <ul class="max-h-[32rem] space-y-3 overflow-y-auto">
            {productos.map((p) => (
              <li
                key={p.sku}
                class={`flex items-center gap-4 rounded-lg border p-3 dark:border-neutral-800 ${
                  p.activo ? "border-neutral-200" : "border-neutral-200 opacity-60 dark:border-neutral-800"
                }`}
              >
                {p.imagen ? (
                  <img src={p.imagen} alt="" class="h-14 w-14 flex-none rounded-md object-cover" />
                ) : (
                  <div class="h-14 w-14 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                )}
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.nombre}</p>
                  <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {p.sku} · {p.marca} · {p.precio != null ? `S/ ${p.precio}` : "Sin precio (cotizar)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alternarActivo(p)}
                  class={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    p.activo
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {p.activo ? "Activo" : "Inactivo"}
                </button>
                <button
                  type="button"
                  onClick={() => editar(p)}
                  class="shrink-0 text-sm text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => borrar(p)}
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

interface CampoProps {
  label: string;
  value: string;
  onInput: (valor: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

function Campo({ label, value, onInput, type = "text", required, disabled }: CampoProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:disabled:bg-neutral-800"
      />
    </div>
  );
}
