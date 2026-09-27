import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import {
  categoriasAdmin,
  productosAdmin,
  subcategoriasAdmin,
  subirImagen,
  type CategoriaAdmin,
  type ProductoAdmin,
  type SubcategoriaAdmin,
} from "../../lib/supabase-admin";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const NUEVA_SUBCATEGORIA = "__nueva__";

const PRODUCTO_VACIO = {
  sku: "",
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

function productoAFormulario(p: ProductoAdmin) {
  return {
    sku: p.sku,
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

export default function AdminCategoriasYProductos() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  // --- datos ---
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaAdmin[]>([]);
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- categoría: agregar/editar ---
  const [catFormAbierto, setCatFormAbierto] = useState(false);
  const [catEditandoSlug, setCatEditandoSlug] = useState<string | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [archivoCategoria, setArchivoCategoria] = useState<File | null>(null);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);

  // --- categoría expandida (muestra subcategorías + productos de esa categoría) ---
  const [expandida, setExpandida] = useState<string | null>(null);
  const [nuevaSub, setNuevaSub] = useState("");

  // --- producto: agregar/editar (siempre dentro de la categoría expandida) ---
  const [prodFormAbierto, setProdFormAbierto] = useState(false);
  const [prodEditandoSku, setProdEditandoSku] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState(PRODUCTO_VACIO);
  const [escribiendoNuevaSub, setEscribiendoNuevaSub] = useState(false);
  const [archivosProducto, setArchivosProducto] = useState<File[]>([]);
  const [archivoVideoProducto, setArchivoVideoProducto] = useState<File | null>(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const [c, s, p] = await Promise.all([categoriasAdmin.listar(), subcategoriasAdmin.listar(), productosAdmin.listar()]);
    setCategorias(c);
    setSubcategorias(s);
    setProductos(p);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  // ===== Categoría =====

  function editarCategoria(cat: CategoriaAdmin) {
    setCatEditandoSlug(cat.slug);
    setNombreCategoria(cat.nombre);
    setArchivoCategoria(null);
    setCatFormAbierto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarCategoria() {
    setCatEditandoSlug(null);
    setNombreCategoria("");
    setArchivoCategoria(null);
    setCatFormAbierto(false);
    (document.getElementById("form-categoria") as HTMLFormElement)?.reset();
  }

  async function guardarCategoria(e: Event) {
    e.preventDefault();
    if (!nombreCategoria.trim()) return;
    setGuardandoCategoria(true);
    setErrorCategoria(null);
    try {
      if (catEditandoSlug) {
        const cambios: Partial<CategoriaAdmin> = { nombre: nombreCategoria.trim() };
        if (archivoCategoria) cambios.foto_url = await subirImagen(archivoCategoria, "categorias");
        await categoriasAdmin.actualizar(catEditandoSlug, cambios);
      } else {
        const foto_url = archivoCategoria ? await subirImagen(archivoCategoria, "categorias") : null;
        await categoriasAdmin.crear({
          slug: slugify(nombreCategoria),
          nombre: nombreCategoria.trim(),
          foto_url,
          orden: categorias.length,
          activo: true,
        });
      }
      cancelarCategoria();
      await cargar();
    } catch (err) {
      setErrorCategoria(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardandoCategoria(false);
    }
  }

  async function alternarActivaCategoria(cat: CategoriaAdmin) {
    await categoriasAdmin.actualizar(cat.slug, { activo: !cat.activo });
    await cargar();
  }

  async function borrarCategoria(cat: CategoriaAdmin) {
    if (!confirm(`¿Borrar la categoría "${cat.nombre}"? Solo se puede si no tiene productos.`)) return;
    try {
      await categoriasAdmin.borrar(cat.slug);
      await cargar();
    } catch {
      alert("No se pudo borrar — probablemente todavía tiene productos asignados.");
    }
  }

  function alternarExpandida(slug: string) {
    setExpandida((actual) => (actual === slug ? null : slug));
    setNuevaSub("");
    cancelarProducto();
  }

  // ===== Subcategoría =====

  function subcategoriasDe(categoriaSlug: string) {
    return subcategorias.filter((s) => s.categoria_slug === categoriaSlug);
  }

  async function agregarSubcategoria(categoriaSlug: string) {
    const texto = nuevaSub.trim();
    if (!texto) return;
    try {
      await subcategoriasAdmin.crear({
        categoria_slug: categoriaSlug,
        nombre: texto,
        orden: subcategoriasDe(categoriaSlug).length,
      });
      setNuevaSub("");
      await cargar();
    } catch {
      alert("No se pudo agregar — es probable que ya exista una subcategoría con ese nombre en esta categoría.");
    }
  }

  async function borrarSubcategoria(sub: SubcategoriaAdmin) {
    if (!confirm(`¿Borrar la subcategoría "${sub.nombre}"? Los productos que ya la tienen asignada no se modifican, solo deja de aparecer como opción para productos nuevos.`)) return;
    await subcategoriasAdmin.borrar(sub.id);
    await cargar();
  }

  // ===== Producto =====

  function productosDe(categoriaSlug: string) {
    return productos.filter((p) => p.categoria_slug === categoriaSlug);
  }

  function campoProducto<K extends keyof typeof PRODUCTO_VACIO>(clave: K, valor: (typeof PRODUCTO_VACIO)[K]) {
    setProdForm((f) => ({ ...f, [clave]: valor }));
  }

  function agregarProducto() {
    setProdEditandoSku(null);
    setProdForm(PRODUCTO_VACIO);
    setArchivosProducto([]);
    setArchivoVideoProducto(null);
    setEscribiendoNuevaSub(false);
    setProdFormAbierto(true);
  }

  function editarProducto(p: ProductoAdmin) {
    setProdEditandoSku(p.sku);
    setProdForm(productoAFormulario(p));
    setArchivosProducto([]);
    setArchivoVideoProducto(null);
    setEscribiendoNuevaSub(false);
    setProdFormAbierto(true);
  }

  function cancelarProducto() {
    setProdFormAbierto(false);
    setProdEditandoSku(null);
    setProdForm(PRODUCTO_VACIO);
    setArchivosProducto([]);
    setArchivoVideoProducto(null);
    setEscribiendoNuevaSub(false);
  }

  async function elegirSubcategoriaProducto(valor: string) {
    if (valor === NUEVA_SUBCATEGORIA) {
      setEscribiendoNuevaSub(true);
      campoProducto("subcategoria", "");
    } else {
      setEscribiendoNuevaSub(false);
      campoProducto("subcategoria", valor);
    }
  }

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

  async function guardarProducto(e: Event, categoriaSlug: string) {
    e.preventDefault();
    if (!prodForm.sku.trim() || !prodForm.nombre.trim()) return;
    setGuardandoProducto(true);
    setErrorProducto(null);
    try {
      if (escribiendoNuevaSub && prodForm.subcategoria.trim()) {
        try {
          await subcategoriasAdmin.crear({
            categoria_slug: categoriaSlug,
            nombre: prodForm.subcategoria.trim(),
            orden: subcategoriasDe(categoriaSlug).length,
          });
        } catch {
          // Ya existía — no pasa nada, se sigue usando el texto tal cual.
        }
      }

      const datosComunes = {
        categoria_slug: categoriaSlug,
        subcategoria: prodForm.subcategoria.trim(),
        nombre: prodForm.nombre.trim(),
        marca: prodForm.marca.trim(),
        precio: prodForm.precio ? Number(prodForm.precio) : null,
        precio_anterior: prodForm.precioAnterior ? Number(prodForm.precioAnterior) : null,
        descripcion: prodForm.descripcion.trim(),
        destacado: prodForm.destacado,
        compatibilidad: parsearCompatibilidad(prodForm.compatibilidad),
        especificaciones: parsearEspecificaciones(prodForm.especificaciones),
      };

      const urlsFotos = archivosProducto.length > 0 ? await Promise.all(archivosProducto.map((a) => subirImagen(a, "productos"))) : null;
      const urlVideo = archivoVideoProducto ? await subirImagen(archivoVideoProducto, "productos") : null;

      if (prodEditandoSku) {
        const cambios: Partial<ProductoAdmin> = {
          ...datosComunes,
          sku: prodForm.sku.trim().toUpperCase(),
        };
        if (urlsFotos) {
          cambios.imagen = urlsFotos[0];
          cambios.imagenes = urlsFotos.slice(1);
        }
        if (urlVideo) cambios.video_url = urlVideo;
        await productosAdmin.actualizar(prodEditandoSku, cambios);
      } else {
        await productosAdmin.crear({
          sku: prodForm.sku.trim().toUpperCase(),
          imagen: urlsFotos ? urlsFotos[0] : null,
          imagenes: urlsFotos ? urlsFotos.slice(1) : null,
          video_url: urlVideo,
          activo: true,
          ...datosComunes,
        });
      }

      cancelarProducto();
      await cargar();
    } catch (err) {
      setErrorProducto(err instanceof Error ? err.message : "Error al guardar. Revisá que el SKU no exista ya.");
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function alternarActivoProducto(p: ProductoAdmin) {
    await productosAdmin.actualizar(p.sku, { activo: !p.activo });
    await cargar();
  }

  async function borrarProducto(p: ProductoAdmin) {
    if (!confirm(`¿Borrar "${p.nombre}" (${p.sku})? Esto no se puede deshacer — si solo quieres ocultarlo, usa "Desactivar".`)) return;
    await productosAdmin.borrar(p.sku);
    await cargar();
  }

  return (
    <div class="space-y-8">
      {!catFormAbierto && (
        <button
          type="button"
          onClick={() => setCatFormAbierto(true)}
          class="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
        >
          + Agregar categoría
        </button>
      )}
      {catFormAbierto && (
        <form id="form-categoria" onSubmit={guardarCategoria} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-neutral-900 dark:text-white">
              {catEditandoSlug ? `Editando: ${catEditandoSlug}` : "Agregar categoría"}
            </h2>
            <button type="button" onClick={cancelarCategoria} class="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
              Cancelar
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="nombre-categoria">
              Nombre
            </label>
            <input
              id="nombre-categoria"
              type="text"
              required
              value={nombreCategoria}
              onInput={(e) => setNombreCategoria((e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            {catEditandoSlug && (
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                La dirección web de esta categoría (/catalogo/{catEditandoSlug}) no cambia aunque
                edites el nombre.
              </p>
            )}
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="foto-categoria">
              Foto {catEditandoSlug && "(opcional — dejá vacío para mantener la actual)"}
            </label>
            <input
              id="foto-categoria"
              type="file"
              accept="image/*"
              onChange={(e) => setArchivoCategoria((e.target as HTMLInputElement).files?.[0] ?? null)}
              class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
            />
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Recomendado: cuadrada, mínimo 500×500px — se muestra recortada en un círculo.
            </p>
          </div>

          {errorCategoria && <p class="text-sm text-red-600 dark:text-red-400">{errorCategoria}</p>}

          <button
            type="submit"
            disabled={guardandoCategoria}
            class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardandoCategoria ? "Guardando..." : catEditandoSlug ? "Guardar cambios" : "Agregar categoría"}
          </button>
        </form>
      )}

      <div>
        <h2 class="mb-3 font-semibold text-neutral-900 dark:text-white">Categorías ({categorias.length})</h2>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : (
          <ul class="space-y-3">
            {categorias.map((c) => {
              const subsDeEsta = subcategoriasDe(c.slug);
              const prodsDeEsta = productosDe(c.slug);
              const estaExpandida = expandida === c.slug;
              return (
                <li key={c.slug} class={`rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${c.activo ? "" : "opacity-60"}`}>
                  <div class="flex flex-wrap items-center gap-3">
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
                      onClick={() => alternarExpandida(c.slug)}
                      class={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                        estaExpandida
                          ? "bg-brand-blue text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {prodsDeEsta.length} producto{prodsDeEsta.length !== 1 && "s"} · {subsDeEsta.length} subcat. {estaExpandida ? "▲" : "▼"}
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarActivaCategoria(c)}
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
                      onClick={() => editarCategoria(c)}
                      class="shrink-0 text-sm text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => borrarCategoria(c)}
                      class="shrink-0 text-sm text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                    >
                      Borrar
                    </button>
                  </div>

                  {estaExpandida && (
                    <div class="mt-4 space-y-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                      {/* Subcategorías */}
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Subcategorías
                        </p>
                        <div class="mt-2 space-y-2">
                          {subsDeEsta.length === 0 && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene subcategorías.</p>
                          )}
                          {subsDeEsta.map((s) => (
                            <div key={s.id} class="flex items-center justify-between gap-2 text-sm">
                              <span class="text-neutral-700 dark:text-neutral-300">{s.nombre}</span>
                              <button
                                type="button"
                                onClick={() => borrarSubcategoria(s)}
                                class="shrink-0 text-xs text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                              >
                                Borrar
                              </button>
                            </div>
                          ))}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              agregarSubcategoria(c.slug);
                            }}
                            class="flex gap-2 pt-1"
                          >
                            <input
                              type="text"
                              placeholder="Nueva subcategoría..."
                              value={nuevaSub}
                              onInput={(e) => setNuevaSub((e.target as HTMLInputElement).value)}
                              class="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                            <button
                              type="submit"
                              class="shrink-0 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
                            >
                              Agregar
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Productos */}
                      <div>
                        <div class="flex items-center justify-between">
                          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Productos
                          </p>
                          {!prodFormAbierto && (
                            <button
                              type="button"
                              onClick={agregarProducto}
                              class="text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                            >
                              + Agregar producto
                            </button>
                          )}
                        </div>

                        {prodFormAbierto && (
                          <form
                            onSubmit={(e) => guardarProducto(e, c.slug)}
                            class="mt-3 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/60"
                          >
                            <div class="flex items-center justify-between">
                              <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                                {prodEditandoSku ? `Editando: ${prodEditandoSku}` : "Nuevo producto"}
                              </p>
                              <button type="button" onClick={cancelarProducto} class="text-xs text-neutral-500 hover:underline dark:text-neutral-400">
                                Cancelar
                              </button>
                            </div>

                            <div class="grid gap-3 sm:grid-cols-2">
                              <CampoTexto label="SKU" value={prodForm.sku} onInput={(v) => campoProducto("sku", v)} required />
                              <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Subcategoría</label>
                                <select
                                  required={!escribiendoNuevaSub}
                                  value={escribiendoNuevaSub ? NUEVA_SUBCATEGORIA : prodForm.subcategoria}
                                  onInput={(e) => elegirSubcategoriaProducto((e.target as HTMLSelectElement).value)}
                                  class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                >
                                  <option value="" disabled>
                                    Elegir subcategoría
                                  </option>
                                  {subsDeEsta.map((s) => (
                                    <option value={s.nombre}>{s.nombre}</option>
                                  ))}
                                  <option value={NUEVA_SUBCATEGORIA}>+ Nueva subcategoría...</option>
                                </select>
                                {escribiendoNuevaSub && (
                                  <input
                                    type="text"
                                    required
                                    autofocus
                                    placeholder="Nombre de la nueva subcategoría"
                                    value={prodForm.subcategoria}
                                    onInput={(e) => campoProducto("subcategoria", (e.target as HTMLInputElement).value)}
                                    class="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                  />
                                )}
                              </div>
                              <CampoTexto label="Nombre" value={prodForm.nombre} onInput={(v) => campoProducto("nombre", v)} required />
                              <CampoTexto label="Marca" value={prodForm.marca} onInput={(v) => campoProducto("marca", v)} required />
                              <CampoTexto
                                label="Precio (S/, opcional)"
                                type="number"
                                value={prodForm.precio}
                                onInput={(v) => campoProducto("precio", v)}
                              />
                              <CampoTexto
                                label="Precio anterior (S/, opcional)"
                                type="number"
                                value={prodForm.precioAnterior}
                                onInput={(v) => campoProducto("precioAnterior", v)}
                              />
                            </div>

                            <div>
                              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción</label>
                              <textarea
                                required
                                rows={3}
                                value={prodForm.descripcion}
                                onInput={(e) => campoProducto("descripcion", (e.target as HTMLTextAreaElement).value)}
                                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                              />
                            </div>

                            <div>
                              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Modelos compatibles (opcional, separados por coma)
                              </label>
                              <input
                                type="text"
                                placeholder="Toyota Yaris 2015-2021, Kia Rio 2017-2022"
                                value={prodForm.compatibilidad}
                                onInput={(e) => campoProducto("compatibilidad", (e.target as HTMLInputElement).value)}
                                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                              />
                            </div>

                            <div>
                              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Ficha técnica (opcional, una línea por dato: etiqueta: valor)
                              </label>
                              <textarea
                                rows={3}
                                placeholder={"Voltaje: 12V\nContenido: Par (2 unidades)"}
                                value={prodForm.especificaciones}
                                onInput={(e) => campoProducto("especificaciones", (e.target as HTMLTextAreaElement).value)}
                                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                              />
                            </div>

                            <div>
                              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Fotos (podés elegir varias) {prodEditandoSku && "— opcional, dejá vacío para mantener las actuales"}
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setArchivosProducto(Array.from((e.target as HTMLInputElement).files ?? []))}
                                class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
                              />
                              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                La primera foto es la principal; el resto arma la galería.
                                {archivosProducto.length > 0 && ` (${archivosProducto.length} elegidas)`}
                              </p>
                            </div>

                            <div>
                              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Video (opcional) {prodEditandoSku && "— dejá vacío para mantener el actual"}
                              </label>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setArchivoVideoProducto((e.target as HTMLInputElement).files?.[0] ?? null)}
                                class="mt-1 block w-full text-sm text-neutral-700 dark:text-neutral-300"
                              />
                              {archivoVideoProducto && (
                                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Video elegido: {archivoVideoProducto.name}</p>
                              )}
                            </div>

                            <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                              <input
                                type="checkbox"
                                checked={prodForm.destacado}
                                onChange={(e) => campoProducto("destacado", (e.target as HTMLInputElement).checked)}
                              />
                              Mostrar en "Productos destacados" de Home
                            </label>

                            {errorProducto && <p class="text-sm text-red-600 dark:text-red-400">{errorProducto}</p>}

                            <button
                              type="submit"
                              disabled={guardandoProducto}
                              class="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {guardandoProducto ? "Guardando..." : prodEditandoSku ? "Guardar cambios" : "Agregar producto"}
                            </button>
                          </form>
                        )}

                        <ul class="mt-3 space-y-2">
                          {prodsDeEsta.length === 0 && !prodFormAbierto && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene productos.</p>
                          )}
                          {prodsDeEsta.map((p) => (
                            <li
                              key={p.sku}
                              class={`flex items-center gap-3 rounded-md border p-2.5 dark:border-neutral-800 ${
                                p.activo ? "border-neutral-200" : "border-neutral-200 opacity-60 dark:border-neutral-800"
                              }`}
                            >
                              {p.imagen ? (
                                <img src={p.imagen} alt="" class="h-10 w-10 flex-none rounded-md object-cover" />
                              ) : (
                                <div class="h-10 w-10 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                              )}
                              <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.nombre}</p>
                                <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {p.sku} · {p.marca} · {p.precio != null ? `S/ ${p.precio}` : "Sin precio"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => alternarActivoProducto(p)}
                                class={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
                                  p.activo
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                }`}
                              >
                                {p.activo ? "Activo" : "Inactivo"}
                              </button>
                              <button
                                type="button"
                                onClick={() => editarProducto(p)}
                                class="shrink-0 text-xs text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => borrarProducto(p)}
                                class="shrink-0 text-xs text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                              >
                                Borrar
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

interface CampoTextoProps {
  label: string;
  value: string;
  onInput: (valor: string) => void;
  type?: string;
  required?: boolean;
}

function CampoTexto({ label, value, onInput, type = "text", required }: CampoTextoProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </div>
  );
}
