import { Fragment } from "preact";
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

interface ProductoRapido {
  sku: string;
  nombre: string;
  marca: string;
  precio: string;
  subcategoria: string;
  archivo: File | null;
}

const PRODUCTO_RAPIDO_VACIO: ProductoRapido = { sku: "", nombre: "", marca: "", precio: "", subcategoria: "", archivo: null };

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
  enlaceConoceMas: "",
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
    enlaceConoceMas: p.enlace_conoce_mas ?? "",
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

  // --- categoría: agregar/editar (modal) ---
  const [catFormAbierto, setCatFormAbierto] = useState(false);
  const [catEditandoSlug, setCatEditandoSlug] = useState<string | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [archivoCategoria, setArchivoCategoria] = useState<File | null>(null);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);
  const [mostrarSubsNuevas, setMostrarSubsNuevas] = useState(false);
  const [subsNuevas, setSubsNuevas] = useState<string[]>([]);
  const [subNuevaTexto, setSubNuevaTexto] = useState("");
  const [mostrarProductosNuevos, setMostrarProductosNuevos] = useState(false);
  const [productosNuevos, setProductosNuevos] = useState<ProductoRapido[]>([]);
  const [productoRapido, setProductoRapido] = useState<ProductoRapido>(PRODUCTO_RAPIDO_VACIO);
  const [errorProductoRapido, setErrorProductoRapido] = useState<string | null>(null);

  // --- categoría expandida (muestra subcategorías + productos de esa categoría) ---
  const [expandida, setExpandida] = useState<string | null>(null);
  const [nuevaSub, setNuevaSub] = useState("");
  const [subEditandoId, setSubEditandoId] = useState<string | null>(null);
  const [nombreSubEditado, setNombreSubEditado] = useState("");
  const [guardandoSub, setGuardandoSub] = useState(false);
  const [subExpandidaId, setSubExpandidaId] = useState<string | null>(null);

  // --- producto: agregar/editar (modal) ---
  const [prodFormAbierto, setProdFormAbierto] = useState(false);
  const [prodFormCategoriaSlug, setProdFormCategoriaSlug] = useState<string | null>(null);
  const [prodEditandoSku, setProdEditandoSku] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState(PRODUCTO_VACIO);
  const [escribiendoNuevaSub, setEscribiendoNuevaSub] = useState(false);
  const [archivosProducto, setArchivosProducto] = useState<File[]>([]);
  const [archivoVideoProducto, setArchivoVideoProducto] = useState<File | null>(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState<string | null>(null);

  // --- filtro único de la tabla (busca en categoría, subcategoría y producto a la vez) ---
  const [filtro, setFiltro] = useState("");
  const [vista, setVista] = useState<"categorias" | "productos">("categorias");
  const [paginaProductos, setPaginaProductos] = useState(1);

  // --- diálogos propios (reemplazan confirm()/alert() del navegador) ---
  const [confirmacion, setConfirmacion] = useState<{
    titulo: string;
    mensaje: string;
    peligroso: boolean;
    onConfirmar: () => void;
  } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function pedirConfirmacion(titulo: string, mensaje: string, onConfirmar: () => void, peligroso = true) {
    setConfirmacion({ titulo, mensaje, peligroso, onConfirmar });
  }

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

  useEffect(() => {
    setPaginaProductos(1);
  }, [filtro, vista]);

  // ===== Categoría =====

  function editarCategoria(cat: CategoriaAdmin) {
    setCatEditandoSlug(cat.slug);
    setNombreCategoria(cat.nombre);
    setArchivoCategoria(null);
    setMostrarSubsNuevas(false);
    setSubsNuevas([]);
    setSubNuevaTexto("");
    setMostrarProductosNuevos(false);
    setProductosNuevos([]);
    setProductoRapido(PRODUCTO_RAPIDO_VACIO);
    setCatFormAbierto(true);
  }

  function cancelarCategoria() {
    setCatEditandoSlug(null);
    setNombreCategoria("");
    setArchivoCategoria(null);
    setMostrarSubsNuevas(false);
    setSubsNuevas([]);
    setSubNuevaTexto("");
    setMostrarProductosNuevos(false);
    setProductosNuevos([]);
    setProductoRapido(PRODUCTO_RAPIDO_VACIO);
    setErrorProductoRapido(null);
    setCatFormAbierto(false);
    (document.getElementById("form-categoria") as HTMLFormElement)?.reset();
  }

  function agregarSubNueva() {
    const texto = subNuevaTexto.trim();
    if (!texto || subsNuevas.includes(texto)) return;
    setSubsNuevas((actual) => [...actual, texto]);
    setSubNuevaTexto("");
  }

  function quitarSubNueva(texto: string) {
    setSubsNuevas((actual) => actual.filter((s) => s !== texto));
  }

  function agregarProductoNuevo() {
    const sku = productoRapido.sku.trim().toUpperCase();
    if (!sku || !productoRapido.nombre.trim() || !productoRapido.marca.trim()) {
      setErrorProductoRapido("Completá al menos SKU, nombre y marca antes de agregarlo a la lista.");
      return;
    }
    if (productosNuevos.some((p) => p.sku === sku)) {
      setErrorProductoRapido(`Ya agregaste un producto con el SKU ${sku} a la lista.`);
      return;
    }
    setProductosNuevos((actual) => [...actual, { ...productoRapido, sku }]);
    setProductoRapido({ ...PRODUCTO_RAPIDO_VACIO, subcategoria: productoRapido.subcategoria });
    setErrorProductoRapido(null);
  }

  function quitarProductoNuevo(sku: string) {
    setProductosNuevos((actual) => actual.filter((p) => p.sku !== sku));
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
        cancelarCategoria();
      } else {
        const slug = slugify(nombreCategoria);
        const foto_url = archivoCategoria ? await subirImagen(archivoCategoria, "categorias") : null;
        await categoriasAdmin.crear({
          slug,
          nombre: nombreCategoria.trim(),
          foto_url,
          orden: categorias.length,
          activo: true,
        });
        await Promise.all(
          subsNuevas.map((nombre, i) => subcategoriasAdmin.crear({ categoria_slug: slug, nombre, orden: i })),
        );
        await Promise.all(
          productosNuevos.map(async (p) => {
            const imagen = p.archivo ? await subirImagen(p.archivo, "productos") : null;
            await productosAdmin.crear({
              sku: p.sku,
              categoria_slug: slug,
              subcategoria: p.subcategoria.trim(),
              nombre: p.nombre.trim(),
              marca: p.marca.trim(),
              precio: p.precio ? Number(p.precio) : null,
              precio_anterior: null,
              imagen,
              imagenes: [],
              video_url: null,
              descripcion: "",
              destacado: false,
              activo: true,
              compatibilidad: null,
              especificaciones: null,
            });
          }),
        );
        cancelarCategoria();
        // Deja la categoría recién creada expandida para completar lo que haga falta (fotos, descripción, etc.).
        setExpandida(slug);
      }
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

  function borrarCategoria(cat: CategoriaAdmin) {
    pedirConfirmacion(`Borrar "${cat.nombre}"`, "Solo se puede borrar si la categoría no tiene productos asignados.", async () => {
      try {
        await categoriasAdmin.borrar(cat.slug);
        await cargar();
      } catch {
        setAviso("No se pudo borrar — probablemente todavía tiene productos asignados.");
      }
    });
  }

  function alternarExpandida(slug: string) {
    setExpandida((actual) => (actual === slug ? null : slug));
    setNuevaSub("");
    setSubExpandidaId(null);
    cancelarEdicionSub();
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
      setAviso("No se pudo agregar — es probable que ya exista una subcategoría con ese nombre en esta categoría.");
    }
  }

  function productosConSubcategoria(sub: SubcategoriaAdmin) {
    return productos.filter((p) => p.categoria_slug === sub.categoria_slug && p.subcategoria === sub.nombre);
  }

  function editarSubcategoria(sub: SubcategoriaAdmin) {
    setSubEditandoId(sub.id);
    setNombreSubEditado(sub.nombre);
  }

  function cancelarEdicionSub() {
    setSubEditandoId(null);
    setNombreSubEditado("");
  }

  async function guardarSubcategoria(sub: SubcategoriaAdmin) {
    const nuevoNombre = nombreSubEditado.trim();
    if (!nuevoNombre || nuevoNombre === sub.nombre) {
      cancelarEdicionSub();
      return;
    }
    setGuardandoSub(true);
    try {
      await subcategoriasAdmin.renombrar(sub.id, nuevoNombre);
      // Los productos guardan el nombre de la subcategoría como texto, no
      // como referencia — hay que actualizarlos a mano para que no se
      // queden apuntando al nombre viejo que ya no existe en la lista.
      const productosAfectados = productosConSubcategoria(sub);
      await Promise.all(
        productosAfectados.map((p) => productosAdmin.actualizar(p.sku, { subcategoria: nuevoNombre })),
      );
      cancelarEdicionSub();
      await cargar();
    } catch {
      setAviso("No se pudo renombrar — es probable que ya exista otra subcategoría con ese nombre en esta categoría.");
    } finally {
      setGuardandoSub(false);
    }
  }

  function borrarSubcategoria(sub: SubcategoriaAdmin) {
    const afectados = productosConSubcategoria(sub);
    const mensaje =
      afectados.length > 0
        ? `${afectados.length} producto${afectados.length !== 1 ? "s" : ""} la tiene${afectados.length !== 1 ? "n" : ""} asignada actualmente. No se van a modificar ni a borrar, pero esta subcategoría dejará de estar disponible para elegir en productos nuevos.`
        : "Ningún producto la tiene asignada actualmente — se puede borrar sin afectar nada.";
    pedirConfirmacion(`Borrar subcategoría "${sub.nombre}"`, mensaje, async () => {
      await subcategoriasAdmin.borrar(sub.id);
      await cargar();
    }, afectados.length > 0);
  }

  // ===== Producto =====

  function productosDe(categoriaSlug: string) {
    return productos.filter((p) => p.categoria_slug === categoriaSlug);
  }

  function normalizar(texto: string) {
    return texto.trim().toLowerCase();
  }

  const categoriasFiltradas = categorias.filter((c) => {
    const texto = normalizar(filtro);
    if (!texto) return true;

    const coincideCategoria = c.nombre.toLowerCase().includes(texto) || c.slug.includes(texto);
    const coincideSubcategoria = subcategoriasDe(c.slug).some((s) => s.nombre.toLowerCase().includes(texto));
    const coincideProducto = productosDe(c.slug).some(
      (p) => p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto),
    );

    return coincideCategoria || coincideSubcategoria || coincideProducto;
  });

  const hayFiltrosActivos = Boolean(filtro);

  function limpiarFiltros() {
    setFiltro("");
  }

  const productosFiltrados = productos.filter((p) => {
    const texto = normalizar(filtro);
    if (!texto) return true;
    const nombreCat = categorias.find((c) => c.slug === p.categoria_slug)?.nombre ?? "";
    return (
      p.nombre.toLowerCase().includes(texto) ||
      p.sku.toLowerCase().includes(texto) ||
      p.marca.toLowerCase().includes(texto) ||
      p.subcategoria.toLowerCase().includes(texto) ||
      nombreCat.toLowerCase().includes(texto)
    );
  });

  const PRODUCTOS_POR_PAGINA = 20;
  const totalPaginasProductos = Math.max(1, Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA));
  const paginaProductosSegura = Math.min(paginaProductos, totalPaginasProductos);
  const productosPagina = productosFiltrados.slice(
    (paginaProductosSegura - 1) * PRODUCTOS_POR_PAGINA,
    paginaProductosSegura * PRODUCTOS_POR_PAGINA,
  );

  function campoProducto<K extends keyof typeof PRODUCTO_VACIO>(clave: K, valor: (typeof PRODUCTO_VACIO)[K]) {
    setProdForm((f) => ({ ...f, [clave]: valor }));
  }

  function agregarProducto(categoriaSlug: string, subcategoria?: string) {
    setProdFormCategoriaSlug(categoriaSlug);
    setProdEditandoSku(null);
    setProdForm({ ...PRODUCTO_VACIO, subcategoria: subcategoria ?? "" });
    setArchivosProducto([]);
    setArchivoVideoProducto(null);
    setEscribiendoNuevaSub(false);
    setProdFormAbierto(true);
  }

  function editarProducto(p: ProductoAdmin) {
    setProdFormCategoriaSlug(p.categoria_slug);
    setProdEditandoSku(p.sku);
    setProdForm(productoAFormulario(p));
    setArchivosProducto([]);
    setArchivoVideoProducto(null);
    setEscribiendoNuevaSub(false);
    setProdFormAbierto(true);
  }

  function cancelarProducto() {
    setProdFormAbierto(false);
    setProdFormCategoriaSlug(null);
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

  async function guardarProducto(e: Event) {
    e.preventDefault();
    if (!prodForm.sku.trim() || !prodForm.nombre.trim() || !prodFormCategoriaSlug) return;
    const categoriaSlug = prodFormCategoriaSlug;
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
        // Solo se envía si hay algo que guardar o borrar: así el panel sigue
        // funcionando aunque todavía no se haya corrido la migración que
        // crea la columna enlace_conoce_mas.
        ...(prodForm.enlaceConoceMas.trim() || productos.find((p) => p.sku === prodEditandoSku)?.enlace_conoce_mas
          ? { enlace_conoce_mas: prodForm.enlaceConoceMas.trim() || null }
          : {}),
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

  function borrarProducto(p: ProductoAdmin) {
    pedirConfirmacion(`Borrar "${p.nombre}"`, `SKU ${p.sku}. Esto no se puede deshacer — si solo querés ocultarlo del catálogo, usá "Desactivar" en vez de borrarlo.`, async () => {
      await productosAdmin.borrar(p.sku);
      await cargar();
    });
  }

  return (
    <div class="space-y-8">
      <button
        type="button"
        onClick={() => setCatFormAbierto(true)}
        class="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
      >
        + Agregar categoría
      </button>

      {catFormAbierto && (
        <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4">
          <form
            id="form-categoria"
            onSubmit={guardarCategoria}
            class="my-4 max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:my-8 sm:p-5 dark:bg-neutral-900"
          >
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
                autofocus
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

            <div class="space-y-3">
            {!mostrarSubsNuevas && (
              <button
                type="button"
                onClick={() => setMostrarSubsNuevas(true)}
                class="block text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
              >
                {catEditandoSlug ? "Subcategorías" : "+ Agregar subcategorías (opcional)"}
              </button>
            )}

            {mostrarSubsNuevas && (
              <div class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Subcategorías</label>
                  <button
                    type="button"
                    onClick={() => setMostrarSubsNuevas(false)}
                    class="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                  >
                    Ocultar
                  </button>
                </div>

                {catEditandoSlug ? (
                  <>
                    {subcategoriasDe(catEditandoSlug).length > 0 && (
                      <div class="overflow-x-auto">
                      <table class="mt-2 w-full overflow-hidden rounded-md border border-neutral-200 text-left text-sm dark:border-neutral-700">
                        <thead>
                          <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            <th class="px-2.5 py-1.5">Subcategoría</th>
                            <th class="px-2.5 py-1.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subcategoriasDe(catEditandoSlug).map((s) => (
                            <tr key={s.id} class="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                              {subEditandoId === s.id ? (
                                <td colSpan={2} class="px-2.5 py-1.5">
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      guardarSubcategoria(s);
                                    }}
                                    class="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      required
                                      autofocus
                                      value={nombreSubEditado}
                                      onInput={(e) => setNombreSubEditado((e.target as HTMLInputElement).value)}
                                      class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                    />
                                    <button type="submit" disabled={guardandoSub} class="shrink-0 text-xs font-semibold text-brand-blue-dark hover:underline dark:text-brand-blue">
                                      Guardar
                                    </button>
                                    <button type="button" onClick={cancelarEdicionSub} class="shrink-0 text-xs text-neutral-500 hover:underline dark:text-neutral-400">
                                      Cancelar
                                    </button>
                                  </form>
                                </td>
                              ) : (
                                <>
                                  <td class="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300">{s.nombre}</td>
                                  <td class="px-2.5 py-1.5 text-right">
                                    <div class="flex justify-end gap-3">
                                      <button type="button" onClick={() => editarSubcategoria(s)} class="text-xs text-brand-blue-dark hover:underline dark:text-brand-blue">
                                        Editar
                                      </button>
                                      <button type="button" onClick={() => borrarSubcategoria(s)} class="text-xs text-red-600 hover:underline dark:text-red-400">
                                        Borrar
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        agregarSubcategoria(catEditandoSlug);
                      }}
                      class="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Ej: Faros LED"
                        value={nuevaSub}
                        onInput={(e) => setNuevaSub((e.target as HTMLInputElement).value)}
                        class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <button type="submit" class="shrink-0 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        Agregar
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    {subsNuevas.length > 0 && (
                      <div class="overflow-x-auto">
                      <table class="mt-2 w-full overflow-hidden rounded-md border border-neutral-200 text-left text-sm dark:border-neutral-700">
                        <thead>
                          <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            <th class="px-2.5 py-1.5">Subcategoría</th>
                            <th class="px-2.5 py-1.5 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subsNuevas.map((s) => (
                            <tr key={s} class="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                              <td class="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300">{s}</td>
                              <td class="px-2.5 py-1.5 text-right">
                                <button type="button" onClick={() => quitarSubNueva(s)} class="text-xs text-red-600 hover:underline dark:text-red-400">
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )}

                    <div class="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: Faros LED"
                        value={subNuevaTexto}
                        onInput={(e) => setSubNuevaTexto((e.target as HTMLInputElement).value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            agregarSubNueva();
                          }
                        }}
                        class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                      <button
                        type="button"
                        onClick={agregarSubNueva}
                        class="shrink-0 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Agregar
                      </button>
                    </div>
                    <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Se crean junto con la categoría.</p>
                  </>
                )}
              </div>
            )}

            {!mostrarProductosNuevos && (
              <button
                type="button"
                onClick={() => setMostrarProductosNuevos(true)}
                class="block text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
              >
                {catEditandoSlug ? "Productos" : "+ Agregar productos (opcional)"}
              </button>
            )}

            {mostrarProductosNuevos && (
              <div class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Productos</label>
                  <button
                    type="button"
                    onClick={() => setMostrarProductosNuevos(false)}
                    class="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                  >
                    Ocultar
                  </button>
                </div>

                {catEditandoSlug ? (
                  <>
                    {productosDe(catEditandoSlug).length > 0 ? (
                      <div class="overflow-x-auto">
                      <table class="mt-2 w-full overflow-hidden rounded-md border border-neutral-200 text-left text-sm dark:border-neutral-700">
                        <thead>
                          <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            <th class="px-2.5 py-1.5">Producto</th>
                            <th class="px-2.5 py-1.5">SKU</th>
                            <th class="px-2.5 py-1.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosDe(catEditandoSlug).map((p) => (
                            <tr key={p.sku} class="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                              <td class="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300">{p.nombre}</td>
                              <td class="px-2.5 py-1.5 text-neutral-500 dark:text-neutral-400">{p.sku}</td>
                              <td class="px-2.5 py-1.5 text-right">
                                <div class="flex justify-end gap-3">
                                  <button type="button" onClick={() => editarProducto(p)} class="text-xs text-brand-blue-dark hover:underline dark:text-brand-blue">
                                    Editar
                                  </button>
                                  <button type="button" onClick={() => borrarProducto(p)} class="text-xs text-red-600 hover:underline dark:text-red-400">
                                    Borrar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    ) : (
                      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene productos.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => agregarProducto(catEditandoSlug)}
                      class="mt-2 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      + Agregar producto
                    </button>
                  </>
                ) : (
                  <>
                {productosNuevos.length > 0 && (
                  <div class="overflow-x-auto">
                  <table class="mt-2 w-full overflow-hidden rounded-md border border-neutral-200 text-left text-sm dark:border-neutral-700">
                    <thead>
                      <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                        <th class="px-2.5 py-1.5">Producto</th>
                        <th class="px-2.5 py-1.5">SKU</th>
                        <th class="px-2.5 py-1.5">Marca</th>
                        <th class="px-2.5 py-1.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosNuevos.map((p) => (
                        <tr key={p.sku} class="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                          <td class="px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300">{p.nombre}</td>
                          <td class="px-2.5 py-1.5 text-neutral-500 dark:text-neutral-400">{p.sku}</td>
                          <td class="px-2.5 py-1.5 text-neutral-500 dark:text-neutral-400">{p.marca}</td>
                          <td class="px-2.5 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => quitarProductoNuevo(p.sku)}
                              class="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}

                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={productoRapido.sku}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, sku: (e.target as HTMLInputElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <select
                    value={productoRapido.subcategoria}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, subcategoria: (e.target as HTMLSelectElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Subcategoría (opcional)</option>
                    {subsNuevas.map((s) => (
                      <option value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={productoRapido.nombre}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, nombre: (e.target as HTMLInputElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Marca"
                    value={productoRapido.marca}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, marca: (e.target as HTMLInputElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <input
                    type="number"
                    placeholder="Precio S/ (opcional)"
                    value={productoRapido.precio}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, precio: (e.target as HTMLInputElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductoRapido((f) => ({ ...f, archivo: (e.target as HTMLInputElement).files?.[0] ?? null }))}
                    class="text-xs text-neutral-700 dark:text-neutral-300"
                  />
                </div>

                {errorProductoRapido && <p class="mt-1.5 text-xs text-red-600 dark:text-red-400">{errorProductoRapido}</p>}

                <button
                  type="button"
                  onClick={agregarProductoNuevo}
                  class="mt-2 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  + Agregar a la lista
                </button>

                <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Se crean junto con la categoría. Descripción, ficha técnica, más fotos y video se completan después editando el producto desde la tabla.
                </p>
                  </>
                )}
              </div>
            )}
            </div>

            {errorCategoria && <p class="text-sm text-red-600 dark:text-red-400">{errorCategoria}</p>}

            <button
              type="submit"
              disabled={guardandoCategoria}
              class="w-full rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardandoCategoria ? "Guardando..." : catEditandoSlug ? "Guardar cambios" : "Agregar categoría"}
            </button>
          </form>
        </div>
      )}

      <div>
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setVista("categorias")}
            class={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              vista === "categorias"
                ? "bg-brand-blue text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            Categorías ({categorias.length})
          </button>
          <button
            type="button"
            onClick={() => setVista("productos")}
            class={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              vista === "productos"
                ? "bg-brand-blue text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            Todos los productos ({productos.length})
          </button>
        </div>
        <p class="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          {vista === "categorias"
            ? "Tocá una fila para ver y administrar sus subcategorías y productos."
            : "Todos los productos del catálogo, sin importar la categoría."}
        </p>

        <div class="mb-4 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <svg class="h-5 w-5 flex-none text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por categoría, subcategoría o producto (nombre o SKU)..."
            value={filtro}
            onInput={(e) => setFiltro((e.target as HTMLInputElement).value)}
            class="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
          />
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              class="shrink-0 text-xs font-semibold text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
            >
              Limpiar
            </button>
          )}
        </div>

        {vista === "categorias" && (cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : categoriasFiltradas.length === 0 ? (
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Ninguna categoría coincide con los filtros.</p>
        ) : (
          <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
                  <th class="px-4 py-3">Categoría</th>
                  <th class="px-4 py-3">Subcategorías</th>
                  <th class="px-4 py-3">Productos</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categoriasFiltradas.map((c) => {
                  const subsDeEsta = subcategoriasDe(c.slug);
                  const prodsDeEsta = productosDe(c.slug);
                  const estaExpandida = expandida === c.slug;
                  const textoFiltro = normalizar(filtro);
                  const subsMostradas = textoFiltro
                    ? subsDeEsta.filter((s) => s.nombre.toLowerCase().includes(textoFiltro))
                    : subsDeEsta;
                  const prodsMostrados = textoFiltro
                    ? prodsDeEsta.filter(
                        (p) => p.nombre.toLowerCase().includes(textoFiltro) || p.sku.toLowerCase().includes(textoFiltro),
                      )
                    : prodsDeEsta;
                  return (
                    <Fragment key={c.slug}>
                      <tr
                        onClick={() => alternarExpandida(c.slug)}
                        class={`cursor-pointer border-b border-neutral-100 transition-colors duration-200 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50 ${
                          estaExpandida ? "bg-brand-blue/5 dark:bg-brand-blue/10" : ""
                        } ${c.activo ? "" : "opacity-60"}`}
                      >
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-3">
                            {c.foto_url ? (
                              <img src={c.foto_url} alt="" class="h-10 w-10 flex-none rounded-full object-cover" />
                            ) : (
                              <div class="h-10 w-10 flex-none rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            )}
                            <div class="min-w-0">
                              <p class="truncate font-semibold text-neutral-900 dark:text-neutral-100">{c.nombre}</p>
                              <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">/{c.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{subsDeEsta.length}</td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{prodsDeEsta.length}</td>
                        <td class="px-4 py-3">
                          <span
                            class={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              c.activo
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {c.activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center justify-end gap-3 text-xs font-medium">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                alternarActivaCategoria(c);
                              }}
                              class="text-neutral-500 transition-colors duration-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            >
                              {c.activo ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                editarCategoria(c);
                              }}
                              class="text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                borrarCategoria(c);
                              }}
                              class="text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                            >
                              Borrar
                            </button>
                            <svg
                              class={`h-5 w-5 flex-none text-neutral-400 transition-transform duration-200 ${estaExpandida ? "rotate-180" : ""}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        </td>
                      </tr>
                      {estaExpandida && (
                        <tr class="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                          <td colSpan={5} class="bg-neutral-50/50 p-4 dark:bg-neutral-900/30">
                            <div class="space-y-5">
                      {/* Subcategorías */}
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Subcategorías {textoFiltro && `(${subsMostradas.length} de ${subsDeEsta.length} coinciden)`}
                        </p>
                        <div class="mt-2 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                          {subsDeEsta.length === 0 ? (
                            <p class="p-3 text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene subcategorías.</p>
                          ) : (
                            <table class="w-full text-left text-sm">
                              <thead>
                                <tr class="border-b border-neutral-200 bg-white text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                                  <th class="px-3 py-2">Subcategoría</th>
                                  <th class="px-3 py-2">Productos</th>
                                  <th class="px-3 py-2 text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subsMostradas.length === 0 && (
                                  <tr>
                                    <td colSpan={3} class="px-3 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                                      Ninguna subcategoría coincide con el filtro.
                                    </td>
                                  </tr>
                                )}
                                {subsMostradas.map((s) => (
                                  <tr key={s.id} class="border-b border-neutral-100 bg-white last:border-0 dark:border-neutral-800 dark:bg-neutral-900/60">
                                    {subEditandoId === s.id ? (
                                      <td colSpan={3} class="px-3 py-2">
                                        <form
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            guardarSubcategoria(s);
                                          }}
                                          class="flex items-center gap-2"
                                        >
                                          <input
                                            type="text"
                                            required
                                            autofocus
                                            value={nombreSubEditado}
                                            onInput={(e) => setNombreSubEditado((e.target as HTMLInputElement).value)}
                                            class="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                          />
                                          <button
                                            type="submit"
                                            disabled={guardandoSub}
                                            class="shrink-0 text-xs font-semibold text-brand-blue-dark transition-colors duration-200 hover:underline disabled:opacity-50 dark:text-brand-blue"
                                          >
                                            Guardar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelarEdicionSub}
                                            class="shrink-0 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                                          >
                                            Cancelar
                                          </button>
                                        </form>
                                      </td>
                                    ) : (
                                      <>
                                        <td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">{s.nombre}</td>
                                        <td class="px-3 py-2">
                                          <button
                                            type="button"
                                            onClick={() => setSubExpandidaId((actual) => (actual === s.id ? null : s.id))}
                                            class={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors duration-200 ${
                                              subExpandidaId === s.id
                                                ? "bg-brand-blue text-white"
                                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                                            }`}
                                          >
                                            {productosConSubcategoria(s).length} {subExpandidaId === s.id ? "▲" : "▼"}
                                          </button>
                                        </td>
                                        <td class="px-3 py-2">
                                          <div class="flex justify-end gap-3">
                                            <button
                                              type="button"
                                              onClick={() => editarSubcategoria(s)}
                                              class="text-xs text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                                            >
                                              Editar
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => borrarSubcategoria(s)}
                                              class="text-xs text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                                {subExpandidaId && subsMostradas.some((s) => s.id === subExpandidaId) && (
                                  <tr class="border-b border-neutral-100 bg-neutral-50 last:border-0 dark:border-neutral-800 dark:bg-neutral-900/40">
                                    <td colSpan={3} class="px-3 py-2">
                                      {(() => {
                                        const sub = subsMostradas.find((s) => s.id === subExpandidaId)!;
                                        const prods = productosConSubcategoria(sub);
                                        return (
                                          <>
                                            <div class="mb-2 flex items-center justify-between">
                                              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                Productos en "{sub.nombre}"
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => agregarProducto(c.slug, sub.nombre)}
                                                class="text-xs font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                                              >
                                                + Agregar producto
                                              </button>
                                            </div>
                                            {prods.length === 0 ? (
                                          <p class="text-sm text-neutral-500 dark:text-neutral-400">Ningún producto usa "{sub.nombre}" todavía.</p>
                                        ) : (
                                          <ul class="space-y-2">
                                            {prods.map((p) => (
                                              <li
                                                key={p.sku}
                                                class="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
                                              >
                                                {p.imagen ? (
                                                  <img src={p.imagen} alt="" class="h-9 w-9 flex-none rounded-md object-cover" />
                                                ) : (
                                                  <div class="h-9 w-9 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                                                )}
                                                <div class="min-w-0 flex-1">
                                                  <p class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.nombre}</p>
                                                  <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                                    {p.sku} · {p.marca} · {p.precio != null ? `S/ ${p.precio}` : "Sin precio"}
                                                  </p>
                                                </div>
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
                                        )}
                                          </>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              agregarSubcategoria(c.slug);
                            }}
                            class="flex gap-2 border-t border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900"
                          >
                            <input
                              type="text"
                              placeholder="Nueva subcategoría..."
                              value={nuevaSub}
                              onInput={(e) => setNuevaSub((e.target as HTMLInputElement).value)}
                              class="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
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
                            Productos {textoFiltro && `(${prodsMostrados.length} de ${prodsDeEsta.length} coinciden)`}
                          </p>
                          <button
                            type="button"
                            onClick={() => agregarProducto(c.slug)}
                            class="text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                          >
                            + Agregar producto
                          </button>
                        </div>

                        <ul class="mt-3 space-y-2">
                          {prodsDeEsta.length === 0 && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene productos.</p>
                          )}
                          {prodsDeEsta.length > 0 && prodsMostrados.length === 0 && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Ningún producto coincide con el filtro.</p>
                          )}
                          {prodsMostrados.map((p) => (
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {vista === "productos" && (
          cargando ? (
            <p class="text-sm text-neutral-500">Cargando...</p>
          ) : productosFiltrados.length === 0 ? (
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Ningún producto coincide con el filtro.</p>
          ) : (
            <>
              <div class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
                      <th class="px-4 py-3">Producto</th>
                      <th class="px-4 py-3">Categoría</th>
                      <th class="px-4 py-3">Subcategoría</th>
                      <th class="px-4 py-3">Precio</th>
                      <th class="px-4 py-3">Estado</th>
                      <th class="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPagina.map((p) => (
                      <tr
                        key={p.sku}
                        class={`border-b border-neutral-100 last:border-0 dark:border-neutral-800 ${p.activo ? "" : "opacity-60"}`}
                      >
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-3">
                            {p.imagen ? (
                              <img src={p.imagen} alt="" class="h-10 w-10 flex-none rounded-md object-cover" />
                            ) : (
                              <div class="h-10 w-10 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                            )}
                            <div class="min-w-0">
                              <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.nombre}</p>
                              <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">{p.sku} · {p.marca}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {categorias.find((c) => c.slug === p.categoria_slug)?.nombre ?? p.categoria_slug}
                        </td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{p.subcategoria}</td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{p.precio != null ? `S/ ${p.precio}` : "Sin precio"}</td>
                        <td class="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => alternarActivoProducto(p)}
                            class={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              p.activo
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {p.activo ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex justify-end gap-3 text-xs font-medium">
                            <button
                              type="button"
                              onClick={() => editarProducto(p)}
                              class="text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => borrarProducto(p)}
                              class="text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPaginasProductos > 1 && (
                <div class="mt-3 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    disabled={paginaProductosSegura <= 1}
                    onClick={() => setPaginaProductos((p) => Math.max(1, p - 1))}
                    class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    ← Anterior
                  </button>
                  <span class="text-xs text-neutral-500 dark:text-neutral-400">
                    Página {paginaProductosSegura} de {totalPaginasProductos} · {productosFiltrados.length} producto{productosFiltrados.length !== 1 && "s"}
                  </span>
                  <button
                    type="button"
                    disabled={paginaProductosSegura >= totalPaginasProductos}
                    onClick={() => setPaginaProductos((p) => Math.min(totalPaginasProductos, p + 1))}
                    class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>

      {prodFormAbierto && prodFormCategoriaSlug && (
        <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4">
          <form
            onSubmit={guardarProducto}
            class="my-4 max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:my-8 sm:p-5 dark:bg-neutral-900"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                  {prodEditandoSku ? `Editando: ${prodEditandoSku}` : "Nuevo producto"}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Categoría: {categorias.find((c) => c.slug === prodFormCategoriaSlug)?.nombre}
                </p>
              </div>
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
                  {subcategoriasDe(prodFormCategoriaSlug).map((s) => (
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
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="enlace-conoce-mas">
                Enlace del botón "¡Conoce más!" (opcional)
              </label>
              <input
                id="enlace-conoce-mas"
                type="url"
                placeholder="https://www.tiktok.com/@skygroupsac/video/..."
                value={prodForm.enlaceConoceMas}
                onInput={(e) => campoProducto("enlaceConoceMas", (e.target as HTMLInputElement).value)}
                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Video de TikTok o YouTube: se ve en una ventana dentro de la ficha. Otro enlace: se abre en una pestaña nueva.
                Vacío: el botón baja a la ficha técnica.
              </p>
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
              class="w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardandoProducto ? "Guardando..." : prodEditandoSku ? "Guardar cambios" : "Agregar producto"}
            </button>
          </form>
        </div>
      )}

      {confirmacion && (
        <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div class="my-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl sm:p-5 dark:bg-neutral-900">
            <h3 class="font-semibold text-neutral-900 dark:text-white">{confirmacion.titulo}</h3>
            <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{confirmacion.mensaje}</p>
            <div class="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                class="rounded-md px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmacion.onConfirmar();
                  setConfirmacion(null);
                }}
                class={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ${
                  confirmacion.peligroso ? "bg-red-600 hover:bg-red-700" : "bg-brand-blue hover:bg-brand-blue-dark"
                }`}
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div class="my-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl sm:p-5 dark:bg-neutral-900">
            <p class="text-sm text-neutral-700 dark:text-neutral-300">{aviso}</p>
            <div class="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAviso(null)}
                class="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
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
