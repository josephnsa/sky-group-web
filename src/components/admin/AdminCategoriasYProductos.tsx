import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import DescripcionProducto from "../DescripcionProducto";
import {
  categoriasAdmin,
  productosAdmin,
  subcategoriasAdmin,
  tiposAdmin,
  ubicacionesAdmin,
  subirImagen,
  type CategoriaAdmin,
  type ProductoAdmin,
  type SubcategoriaAdmin,
  type TipoAdmin,
  type UbicacionAdmin,
} from "../../lib/supabase-admin";
import {
  GestorFotos,
  Paginacion,
  SelectorArchivo,
  fotosDesdeUrls,
  urlsFinales,
  useAvisoBreve,
  usePaginacion,
  type FotoItem,
} from "./ui";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const NUEVA_SUBCATEGORIA = "__nueva__";
const NUEVO_TIPO = "__nuevo_tipo__";

interface ProductoRapido {
  sku: string;
  nombre: string;
  marca: string;
  precio: string;
  subcategoria: string;
  archivo: File | null;
}

// Fila del formulario "Categorías adicionales" de un producto.
interface FilaUbicacion {
  categoria_slug: string;
  subcategoria: string;
  tipo: string;
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
  tipo: "",
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
    tipo: p.tipo ?? "",
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
  // Tercer nivel del Excel ("tipo de producto"). Vacío si la migración
  // docs/migracion-categorias-excel.sql todavía no se corrió.
  const [tipos, setTipos] = useState<TipoAdmin[]>([]);
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  // Categorías adicionales de los productos. null = todavía no se corrió
  // docs/migracion-multicategoria.sql: el panel funciona como antes.
  const [ubicaciones, setUbicaciones] = useState<UbicacionAdmin[] | null>(null);
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
  // Categoría abierta: filtro de su lista de productos por subcategoría.
  const [subFiltro, setSubFiltro] = useState<string | null>(null);
  // Modal de subcategoría: nombre, categorías donde aparece (casillas) y tipos.
  const [subModal, setSubModal] = useState<{
    original: string | null;
    nombre: string;
    categorias: string[];
    tipos: string[];
    nuevoTipo: string;
  } | null>(null);
  const [guardandoSubModal, setGuardandoSubModal] = useState(false);
  const [errorSubModal, setErrorSubModal] = useState<string | null>(null);

  // --- producto: agregar/editar (modal) ---
  const [prodFormAbierto, setProdFormAbierto] = useState(false);
  const [prodFormCategoriaSlug, setProdFormCategoriaSlug] = useState<string | null>(null);
  const [prodEditandoSku, setProdEditandoSku] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState(PRODUCTO_VACIO);
  const [escribiendoNuevaSub, setEscribiendoNuevaSub] = useState(false);
  const [escribiendoNuevoTipo, setEscribiendoNuevoTipo] = useState(false);
  const [archivoFichaTecnica, setArchivoFichaTecnica] = useState<File | null>(null);
  const [quitarFichaTecnica, setQuitarFichaTecnica] = useState(false);
  const [fotosProducto, setFotosProducto] = useState<FotoItem[]>([]);
  const [archivoVideoProducto, setArchivoVideoProducto] = useState<File | null>(null);
  const [quitarVideo, setQuitarVideo] = useState(false);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProducto, setErrorProducto] = useState<string | null>(null);
  const [ubicacionesForm, setUbicacionesForm] = useState<FilaUbicacion[]>([]);

  // --- filtro único de la tabla (busca en categoría, subcategoría y producto a la vez) ---
  const [filtro, setFiltro] = useState("");
  const [vista, setVista] = useState<"categorias" | "productos">("categorias");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"" | "activo" | "inactivo">("");
  const { avisar, aviso: avisoBreve } = useAvisoBreve();

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
    const [c, s, p, t, u] = await Promise.all([
      categoriasAdmin.listar(),
      subcategoriasAdmin.listar(),
      productosAdmin.listar(),
      tiposAdmin.listar(),
      ubicacionesAdmin.listar(),
    ]);
    setCategorias(c);
    setSubcategorias(s);
    setTipos(t);
    setProductos(p);
    setUbicaciones(u);
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
      setErrorProductoRapido("Completa al menos SKU, nombre y marca antes de agregarlo a la lista.");
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
        avisar(`Categoría "${cambios.nombre}" guardada`);
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
        avisar(`Categoría "${nombreCategoria.trim()}" creada`);
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
    pedirConfirmacion(`Borrar "${cat.nombre}"`, "Solo se puede borrar si ningún producto la tiene como categoría principal. Los productos que la usan como categoría adicional dejan de mostrarse en ella.", async () => {
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
    setSubFiltro(null);
    cancelarEdicionSub();
    cancelarProducto();
  }

  // ===== Subcategoría =====

  function subcategoriasDe(categoriaSlug: string) {
    return subcategorias.filter((s) => s.categoria_slug === categoriaSlug);
  }

  // Una subcategoría puede estar en varias categorías: es la misma cuando
  // tiene el mismo nombre (así viene ya en el Excel del cliente).
  function categoriasConSubcategoria(nombre: string) {
    return subcategorias.filter((s) => s.nombre === nombre).map((s) => s.categoria_slug);
  }

  function nombreDeCategoria(slug: string) {
    return categorias.find((c) => c.slug === slug)?.nombre ?? slug;
  }

  function adicionalesDe(sku: string) {
    return (ubicaciones ?? []).filter((u) => u.producto_sku === sku);
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

  // Productos en esta subcategoría de esta categoría: como principal o como adicional.
  function productosConSubcategoria(sub: SubcategoriaAdmin) {
    return productos.filter(
      (p) =>
        (p.categoria_slug === sub.categoria_slug && p.subcategoria === sub.nombre) ||
        adicionalesDe(p.sku).some((u) => u.categoria_slug === sub.categoria_slug && u.subcategoria === sub.nombre),
    );
  }

  function esPrincipalEn(p: ProductoAdmin, categoriaSlug: string, subcategoria?: string) {
    return p.categoria_slug === categoriaSlug && (subcategoria === undefined || p.subcategoria === subcategoria);
  }

  // Subcategoría y tipo del producto dentro de una categoría (principal y adicionales).
  function ubicacionesEnCategoria(p: ProductoAdmin, categoriaSlug: string) {
    const lista: { subcategoria: string; tipo: string | null }[] = [];
    if (p.categoria_slug === categoriaSlug) lista.push({ subcategoria: p.subcategoria, tipo: p.tipo ?? null });
    for (const u of adicionalesDe(p.sku)) {
      if (u.categoria_slug === categoriaSlug) lista.push({ subcategoria: u.subcategoria, tipo: u.tipo ?? null });
    }
    return lista;
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
    // Si la subcategoría está en varias categorías, se renombra en todas.
    const cats = categoriasConSubcategoria(sub.nombre);
    const choca = subcategorias.find((s) => cats.includes(s.categoria_slug) && s.nombre === nuevoNombre);
    if (choca) {
      setAviso(`Ya existe una subcategoría "${nuevoNombre}" en ${nombreDeCategoria(choca.categoria_slug)}.`);
      return;
    }
    setGuardandoSub(true);
    try {
      await subcategoriasAdmin.renombrarEnCategorias(cats, sub.nombre, nuevoNombre);
      // Los productos guardan el nombre de la subcategoría como texto, no
      // como referencia — hay que actualizarlos a mano para que no se
      // queden apuntando al nombre viejo que ya no existe en la lista.
      const productosAfectados = productos.filter((p) => cats.includes(p.categoria_slug) && p.subcategoria === sub.nombre);
      await Promise.all(
        productosAfectados.map((p) => productosAdmin.actualizar(p.sku, { subcategoria: nuevoNombre })),
      );
      // Las categorías adicionales y los tipos de producto pasan a colgar del nombre nuevo.
      if (ubicaciones !== null) await ubicacionesAdmin.renombrarSubcategoria(cats, sub.nombre, nuevoNombre);
      await Promise.all(cats.map((c) => tiposAdmin.renombrarSubcategoria(c, sub.nombre, nuevoNombre)));
      cancelarEdicionSub();
      await cargar();
    } catch {
      setAviso("No se pudo renombrar — es probable que ya exista otra subcategoría con ese nombre en una de sus categorías.");
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
    const tiposDeEsta = tiposDe(sub.categoria_slug, sub.nombre).length;
    const otras = categoriasConSubcategoria(sub.nombre).filter((c) => c !== sub.categoria_slug);
    const mensajeTipos =
      tiposDeEsta > 0 ? `${mensaje} También se borran sus ${tiposDeEsta} tipo${tiposDeEsta !== 1 ? "s" : ""} de producto.` : mensaje;
    const mensajeCompleto = otras.length
      ? `${mensajeTipos} Se quita solo de ${nombreDeCategoria(sub.categoria_slug)}: sigue en ${otras.map(nombreDeCategoria).join(", ")}.`
      : mensajeTipos;
    pedirConfirmacion(otras.length ? `Quitar "${sub.nombre}" de ${nombreDeCategoria(sub.categoria_slug)}` : `Borrar subcategoría "${sub.nombre}"`, mensajeCompleto, async () => {
      await subcategoriasAdmin.borrar(sub.id);
      await tiposAdmin.borrarDeSubcategoria(sub.categoria_slug, sub.nombre);
      await cargar();
    }, afectados.length > 0);
  }

  // ===== Modal de subcategoría =====
  // Una subcategoría puede estar en varias categorías (mismo nombre). El modal
  // las administra juntas: se marcan las categorías donde aparece y sus tipos
  // quedan iguales en todas. Nada se guarda hasta pulsar "Guardar".

  function usoSubEn(categoriaSlug: string, nombre: string) {
    return productos.filter(
      (p) =>
        (p.categoria_slug === categoriaSlug && p.subcategoria === nombre) ||
        adicionalesDe(p.sku).some((u) => u.categoria_slug === categoriaSlug && u.subcategoria === nombre),
    ).length;
  }

  function usoTipo(subNombre: string, tipo: string) {
    const cats = categoriasConSubcategoria(subNombre);
    return (
      productos.filter((p) => cats.includes(p.categoria_slug) && p.subcategoria === subNombre && p.tipo === tipo).length +
      (ubicaciones ?? []).filter((u) => cats.includes(u.categoria_slug) && u.subcategoria === subNombre && u.tipo === tipo).length
    );
  }

  function abrirSubModal(sub: SubcategoriaAdmin | null, categoriaSlug: string) {
    setErrorSubModal(null);
    if (!sub) {
      setSubModal({ original: null, nombre: "", categorias: [categoriaSlug], tipos: [], nuevoTipo: "" });
      return;
    }
    const cats = categoriasConSubcategoria(sub.nombre);
    const nombresTipos: string[] = [];
    for (const cat of [sub.categoria_slug, ...cats]) {
      for (const t of tiposDe(cat, sub.nombre)) if (!nombresTipos.includes(t.nombre)) nombresTipos.push(t.nombre);
    }
    setSubModal({ original: sub.nombre, nombre: sub.nombre, categorias: cats, tipos: nombresTipos, nuevoTipo: "" });
  }

  function alternarCategoriaSubModal(slug: string) {
    setSubModal((m) =>
      m && { ...m, categorias: m.categorias.includes(slug) ? m.categorias.filter((x) => x !== slug) : [...m.categorias, slug] },
    );
  }

  function agregarTipoSubModal() {
    if (!subModal) return;
    const texto = subModal.nuevoTipo.trim();
    if (!texto) return;
    if (subModal.tipos.some((t) => t.toLowerCase() === texto.toLowerCase())) {
      setErrorSubModal(`El tipo "${texto}" ya está en la lista.`);
      return;
    }
    setErrorSubModal(null);
    setSubModal({ ...subModal, tipos: [...subModal.tipos, texto], nuevoTipo: "" });
  }

  async function guardarSubModal(e: Event) {
    e.preventDefault();
    if (!subModal) return;
    const m = subModal;
    const nombre = m.nombre.trim();
    const original = m.original;
    if (!nombre) {
      setErrorSubModal("Escribe el nombre de la subcategoría.");
      return;
    }
    if (m.categorias.length === 0) {
      setErrorSubModal("Marca al menos una categoría.");
      return;
    }
    if (nombre !== original) {
      const choca = subcategorias.find(
        (x) => m.categorias.includes(x.categoria_slug) && x.nombre.toLowerCase() === nombre.toLowerCase() && x.nombre !== original,
      );
      if (choca) {
        setErrorSubModal(`Ya existe "${choca.nombre}" en ${nombreDeCategoria(choca.categoria_slug)}. Ábrela con "Editar" y marca ahí las categorías.`);
        return;
      }
    }
    const actuales = original ? categoriasConSubcategoria(original) : [];
    const quitar = actuales.filter((c) => !m.categorias.includes(c));
    const agregar = m.categorias.filter((c) => !actuales.includes(c));
    const bloqueada = original ? quitar.find((c) => usoSubEn(c, original) > 0) : undefined;
    if (bloqueada) {
      setErrorSubModal(`No se puede quitar de ${nombreDeCategoria(bloqueada)}: hay productos que la usan ahí.`);
      return;
    }
    setGuardandoSubModal(true);
    setErrorSubModal(null);
    try {
      if (original && nombre !== original) {
        // Renombrar en todas sus categorías, con sus productos, ubicaciones y tipos.
        await subcategoriasAdmin.renombrarEnCategorias(actuales, original, nombre);
        const afectados = productos.filter((p) => actuales.includes(p.categoria_slug) && p.subcategoria === original);
        await Promise.all(afectados.map((p) => productosAdmin.actualizar(p.sku, { subcategoria: nombre })));
        if (ubicaciones !== null) await ubicacionesAdmin.renombrarSubcategoria(actuales, original, nombre);
        await Promise.all(actuales.map((c) => tiposAdmin.renombrarSubcategoria(c, original, nombre)));
      }
      for (const c of quitar) {
        const fila = subcategorias.find((x) => x.categoria_slug === c && x.nombre === original);
        if (fila) await subcategoriasAdmin.borrar(fila.id);
        await tiposAdmin.borrarDeSubcategoria(c, nombre);
      }
      for (const c of agregar) {
        await subcategoriasAdmin.crear({ categoria_slug: c, nombre, orden: subcategoriasDe(c).length });
      }
      // Los mismos tipos en todas las categorías marcadas.
      for (const c of m.categorias) {
        const existentes = original && actuales.includes(c) ? tiposDe(c, original) : [];
        for (const t of existentes) if (!m.tipos.includes(t.nombre)) await tiposAdmin.borrar(t.id);
        for (const [i, t] of m.tipos.entries()) {
          if (!existentes.some((x) => x.nombre === t)) {
            await tiposAdmin.crear({ categoria_slug: c, subcategoria: nombre, nombre: t, orden: i });
          }
        }
      }
      setSubModal(null);
      await cargar();
      avisar(original ? `Subcategoría "${nombre}" guardada` : `Subcategoría "${nombre}" creada`);
    } catch {
      setErrorSubModal("No se pudo guardar todo. Revisa tu conexión y vuelve a intentarlo.");
      await cargar();
    } finally {
      setGuardandoSubModal(false);
    }
  }

  function borrarDesdeSubModal() {
    const original = subModal?.original;
    if (!original) return;
    const cats = categoriasConSubcategoria(original);
    const total = cats.reduce((n, c) => n + usoSubEn(c, original), 0);
    const uso =
      total > 0
        ? `${total} producto${total !== 1 ? "s la tienen" : " la tiene"} asignada. No se modifican ni se borran, pero la subcategoría deja de estar disponible.`
        : "Ningún producto la usa: se puede borrar sin afectar nada.";
    const varias =
      cats.length > 1
        ? ` Se borra de todas sus categorías (${cats.map(nombreDeCategoria).join(", ")}). Para quitarla de una sola, desmarca esa categoría y pulsa Guardar.`
        : "";
    pedirConfirmacion(`Borrar subcategoría "${original}"`, `${uso}${varias} También se borran sus tipos de producto.`, async () => {
      for (const c of cats) {
        const fila = subcategorias.find((x) => x.categoria_slug === c && x.nombre === original);
        if (fila) await subcategoriasAdmin.borrar(fila.id);
        await tiposAdmin.borrarDeSubcategoria(c, original);
      }
      setSubModal(null);
      await cargar();
      avisar(`Subcategoría "${original}" borrada`);
    }, total > 0);
  }

  // ===== Tipo de producto (tercer nivel) =====

  function tiposDe(categoriaSlug: string, subcategoria: string) {
    return tipos.filter((t) => t.categoria_slug === categoriaSlug && t.subcategoria === subcategoria);
  }

  // ===== Producto =====

  function productosDe(categoriaSlug: string) {
    return productos.filter(
      (p) => p.categoria_slug === categoriaSlug || adicionalesDe(p.sku).some((u) => u.categoria_slug === categoriaSlug),
    );
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
    if (filtroCategoria && !productosDe(filtroCategoria).includes(p)) return false;
    if (filtroEstado && (filtroEstado === "activo") !== p.activo) return false;
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

  // Paginación de cada lista del panel.
  const pagCategorias = usePaginacion(categoriasFiltradas, 10, [filtro]);
  const pagProductos = usePaginacion(productosFiltrados, 15, [filtro, vista, filtroCategoria, filtroEstado]);
  const [paginaProdsCategoria, setPaginaProdsCategoria] = useState(1);
  useEffect(() => setPaginaProdsCategoria(1), [expandida, filtro, subFiltro]);
  const POR_PAGINA_LISTA = 8;
  const pagina = <T,>(lista: T[], n: number) => lista.slice((n - 1) * POR_PAGINA_LISTA, n * POR_PAGINA_LISTA);

  function campoProducto<K extends keyof typeof PRODUCTO_VACIO>(clave: K, valor: (typeof PRODUCTO_VACIO)[K]) {
    setProdForm((f) => ({ ...f, [clave]: valor }));
  }

  function agregarProducto(categoriaSlug: string, subcategoria?: string) {
    setProdFormCategoriaSlug(categoriaSlug);
    setProdEditandoSku(null);
    setProdForm({ ...PRODUCTO_VACIO, subcategoria: subcategoria ?? "" });
    setUbicacionesForm([]);
    setFotosProducto([]);
    setArchivoVideoProducto(null);
    setQuitarVideo(false);
    setArchivoFichaTecnica(null);
    setQuitarFichaTecnica(false);
    setEscribiendoNuevaSub(false);
    setEscribiendoNuevoTipo(false);
    setProdFormAbierto(true);
  }

  function editarProducto(p: ProductoAdmin) {
    setProdFormCategoriaSlug(p.categoria_slug);
    setProdEditandoSku(p.sku);
    setProdForm(productoAFormulario(p));
    setUbicacionesForm(adicionalesDe(p.sku).map((u) => ({ categoria_slug: u.categoria_slug, subcategoria: u.subcategoria, tipo: u.tipo ?? "" })));
    setFotosProducto(fotosDesdeUrls([p.imagen, ...(p.imagenes ?? [])]));
    setArchivoVideoProducto(null);
    setQuitarVideo(false);
    setArchivoFichaTecnica(null);
    setQuitarFichaTecnica(false);
    setEscribiendoNuevaSub(false);
    setEscribiendoNuevoTipo(false);
    setProdFormAbierto(true);
  }

  function cancelarProducto() {
    setProdFormAbierto(false);
    setProdFormCategoriaSlug(null);
    setProdEditandoSku(null);
    setProdForm(PRODUCTO_VACIO);
    setUbicacionesForm([]);
    setFotosProducto([]);
    setArchivoVideoProducto(null);
    setQuitarVideo(false);
    setArchivoFichaTecnica(null);
    setQuitarFichaTecnica(false);
    setEscribiendoNuevaSub(false);
    setEscribiendoNuevoTipo(false);
  }

  function elegirCategoriaProducto(slug: string) {
    // Al cambiar de categoría, la subcategoría y el tipo elegidos ya no corresponden.
    setProdFormCategoriaSlug(slug);
    setProdForm((f) => ({ ...f, subcategoria: "", tipo: "" }));
    setEscribiendoNuevaSub(false);
    setEscribiendoNuevoTipo(false);
  }

  async function elegirSubcategoriaProducto(valor: string) {
    // Al cambiar de subcategoría, el tipo elegido ya no corresponde.
    campoProducto("tipo", "");
    setEscribiendoNuevoTipo(false);
    if (valor === NUEVA_SUBCATEGORIA) {
      setEscribiendoNuevaSub(true);
      campoProducto("subcategoria", "");
    } else {
      setEscribiendoNuevaSub(false);
      campoProducto("subcategoria", valor);
    }
  }

  function elegirTipoProducto(valor: string) {
    if (valor === NUEVO_TIPO) {
      setEscribiendoNuevoTipo(true);
      campoProducto("tipo", "");
    } else {
      setEscribiendoNuevoTipo(false);
      campoProducto("tipo", valor);
    }
  }

  function agregarFilaUbicacion(fila: FilaUbicacion = { categoria_slug: "", subcategoria: "", tipo: "" }) {
    setUbicacionesForm((actual) => [...actual, fila]);
  }

  function cambiarFilaUbicacion(i: number, cambios: Partial<FilaUbicacion>) {
    setUbicacionesForm((actual) =>
      actual.map((f, j) => {
        if (j !== i) return f;
        const nueva = { ...f, ...cambios };
        // Al cambiar de categoría o de subcategoría, lo que dependía de ella ya no corresponde.
        if (cambios.categoria_slug !== undefined && cambios.categoria_slug !== f.categoria_slug) {
          nueva.subcategoria = "";
          nueva.tipo = "";
        }
        if (cambios.subcategoria !== undefined && cambios.subcategoria !== f.subcategoria) nueva.tipo = "";
        return nueva;
      }),
    );
  }

  function quitarFilaUbicacion(i: number) {
    setUbicacionesForm((actual) => actual.filter((_, j) => j !== i));
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
    if (!prodFormCategoriaSlug) {
      setErrorProducto("Elige la categoría del producto.");
      return;
    }
    if (!prodForm.sku.trim() || !prodForm.nombre.trim()) return;
    const categoriaSlug = prodFormCategoriaSlug;
    if (ubicacionesForm.some((u) => !u.categoria_slug || !u.subcategoria.trim())) {
      setErrorProducto("En Categorías adicionales, elige la categoría y la subcategoría de cada fila, o quita la fila.");
      return;
    }
    // Sin repetir la ubicación principal ni filas iguales.
    const vistas = new Set([`${categoriaSlug}|${prodForm.subcategoria.trim()}`]);
    const ubicacionesDeseadas = ubicacionesForm
      .map((u) => ({ categoria_slug: u.categoria_slug, subcategoria: u.subcategoria.trim(), tipo: u.tipo.trim() || null }))
      .filter((u) => {
        const clave = `${u.categoria_slug}|${u.subcategoria}`;
        if (vistas.has(clave)) return false;
        vistas.add(clave);
        return true;
      });
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

      // Tipo nuevo escrito a mano: se agrega a la lista de su subcategoría.
      const tipoTexto = prodForm.tipo.trim();
      if (
        escribiendoNuevoTipo &&
        tipoTexto &&
        prodForm.subcategoria.trim() &&
        !tiposDe(categoriaSlug, prodForm.subcategoria.trim()).some((t) => t.nombre === tipoTexto)
      ) {
        try {
          await tiposAdmin.crear({
            categoria_slug: categoriaSlug,
            subcategoria: prodForm.subcategoria.trim(),
            nombre: tipoTexto,
            orden: tiposDe(categoriaSlug, prodForm.subcategoria.trim()).length,
          });
        } catch {
          // Ya existía o falta la migración: el producto igual guarda el texto.
        }
      }
      const original = productos.find((p) => p.sku === prodEditandoSku);
      const urlFicha = archivoFichaTecnica ? await subirImagen(archivoFichaTecnica, "fichas") : null;

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
        // Mismo criterio para las columnas de docs/migracion-categorias-excel.sql.
        ...(tipoTexto || original?.tipo ? { tipo: tipoTexto || null } : {}),
        ...(urlFicha ? { ficha_tecnica_url: urlFicha } : quitarFichaTecnica && original?.ficha_tecnica_url ? { ficha_tecnica_url: null } : {}),
      };

      // Fotos en el orden elegido: la 1 es la principal, el resto arma la galería.
      const urlsFotos = await urlsFinales(fotosProducto, (a) => subirImagen(a, "productos"));
      const urlVideo = archivoVideoProducto ? await subirImagen(archivoVideoProducto, "productos") : null;

      if (prodEditandoSku) {
        const cambios: Partial<ProductoAdmin> = {
          ...datosComunes,
          sku: prodForm.sku.trim().toUpperCase(),
        };
        const fotosAntes = [original?.imagen, ...(original?.imagenes ?? [])].filter(Boolean);
        if (JSON.stringify(fotosAntes) !== JSON.stringify(urlsFotos)) {
          cambios.imagen = urlsFotos[0] ?? null;
          cambios.imagenes = urlsFotos.slice(1);
        }
        if (urlVideo) cambios.video_url = urlVideo;
        else if (quitarVideo && original?.video_url) cambios.video_url = null;
        await productosAdmin.actualizar(prodEditandoSku, cambios);
      } else {
        await productosAdmin.crear({
          sku: prodForm.sku.trim().toUpperCase(),
          imagen: urlsFotos[0] ?? null,
          imagenes: urlsFotos.length > 1 ? urlsFotos.slice(1) : null,
          video_url: urlVideo,
          activo: true,
          ...datosComunes,
        });
      }

      // Categorías adicionales (solo si la migración ya se corrió).
      const skuFinal = prodForm.sku.trim().toUpperCase();
      if (ubicaciones !== null) {
        try {
          await ubicacionesAdmin.sincronizar(skuFinal, adicionalesDe(prodEditandoSku ?? skuFinal), ubicacionesDeseadas);
        } catch {
          // El producto ya quedó guardado: el siguiente "Guardar" lo actualiza
          // en vez de intentar crearlo otra vez.
          setProdEditandoSku(skuFinal);
          await cargar();
          throw new Error("El producto se guardó, pero no se pudieron guardar sus categorías adicionales. Vuelve a pulsar Guardar.");
        }
      }

      const nombreGuardado = prodForm.nombre.trim();
      const eraEdicion = Boolean(prodEditandoSku);
      cancelarProducto();
      await cargar();
      avisar(eraEdicion ? `Cambios guardados en "${nombreGuardado}"` : `Producto "${nombreGuardado}" agregado`);
    } catch (err) {
      setErrorProducto(err instanceof Error ? err.message : "Error al guardar. Revisa que el SKU no exista ya.");
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function alternarActivoProducto(p: ProductoAdmin) {
    await productosAdmin.actualizar(p.sku, { activo: !p.activo });
    await cargar();
    avisar(p.activo ? `"${p.nombre}" ya no se muestra en la web` : `"${p.nombre}" ahora se muestra en la web`);
  }

  function borrarProducto(p: ProductoAdmin) {
    pedirConfirmacion(`Borrar "${p.nombre}"`, `SKU ${p.sku}. Esto no se puede deshacer. Si solo quieres ocultarlo del catálogo, usa "Desactivar" en vez de borrarlo.`, async () => {
      await productosAdmin.borrar(p.sku);
      await cargar();
      avisar(`Producto "${p.nombre}" borrado`);
    });
  }

  return (
    <div class="space-y-8">
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCatFormAbierto(true)}
          class="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
        >
          + Agregar categoría
        </button>
        <button
          type="button"
          onClick={() => agregarProducto("")}
          class="inline-flex items-center gap-1.5 rounded-md border border-brand-blue px-4 py-2.5 text-sm font-semibold text-brand-blue-dark transition-colors duration-200 hover:bg-brand-blue/10 dark:text-brand-blue"
        >
          + Agregar producto
        </button>
      </div>

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
                Foto
              </label>
              <SelectorArchivo
                id="foto-categoria"
                accept="image/*"
                tipo="imagen"
                archivo={archivoCategoria}
                onElegir={setArchivoCategoria}
                actual={catEditandoSlug ? categorias.find((c) => c.slug === catEditandoSlug)?.foto_url : null}
                clasePrevia="h-20 w-20 rounded-full object-cover"
              />
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Recomendado: cuadrada, mínimo 500×500 px. Se muestra recortada en un círculo.
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
                    step="0.01"
                    min="0"
                    placeholder="Precio S/ (opcional)"
                    value={productoRapido.precio}
                    onInput={(e) => setProductoRapido((f) => ({ ...f, precio: (e.target as HTMLInputElement).value }))}
                    class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <div class="sm:col-span-2">
                    <SelectorArchivo
                      id="foto-producto-rapido"
                      accept="image/*"
                      tipo="imagen"
                      archivo={productoRapido.archivo}
                      onElegir={(archivo) => setProductoRapido((f) => ({ ...f, archivo }))}
                      clasePrevia="h-14 w-14 object-cover"
                    />
                  </div>
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
            ? "Haz clic en una fila para ver y administrar sus subcategorías y productos."
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
                {pagCategorias.visibles.map((c) => {
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
                  const prodsVisibles = subFiltro
                    ? prodsMostrados.filter((p) => ubicacionesEnCategoria(p, c.slug).some((u) => u.subcategoria === subFiltro))
                    : prodsMostrados;
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
                          <td colSpan={5} class="bg-neutral-50/50 p-2 sm:p-4 dark:bg-neutral-900/30">
                            {/* En celular la tabla se desplaza de lado: el detalle queda fijo y del ancho de la pantalla. */}
                            <div class="sticky left-2 w-[calc(100vw-3.5rem)] space-y-5 sm:static sm:w-auto">
                      {/* Subcategorías: lista simple; cada una se edita en un modal */}
                      <div data-seccion="subcategorias-categoria">
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Subcategorías ({textoFiltro && subsMostradas.length > 0 && subsMostradas.length < subsDeEsta.length ? `${subsMostradas.length} de ${subsDeEsta.length}` : subsDeEsta.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => abrirSubModal(null, c.slug)}
                            class="shrink-0 text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                          >
                            + Nueva subcategoría
                          </button>
                        </div>
                        {subsDeEsta.length === 0 ? (
                          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene subcategorías.</p>
                        ) : (
                          <ul class="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                            {(textoFiltro && subsMostradas.length > 0 ? subsMostradas : subsDeEsta).map((s) => {
                              const otras = categoriasConSubcategoria(s.nombre).filter((x) => x !== s.categoria_slug);
                              const nt = tiposDe(s.categoria_slug, s.nombre).length;
                              const np = productosConSubcategoria(s).length;
                              return (
                                <li key={s.id} data-subcategoria={s.nombre} class="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:gap-x-4">
                                  <div class="w-full min-w-0 sm:w-auto sm:flex-1">
                                    <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{s.nombre}</p>
                                    {otras.length > 0 && (
                                      <p class="mt-1 flex flex-wrap items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        También en:
                                        {otras.map((o) => (
                                          <span key={o} class="rounded-full bg-brand-blue/10 px-2 py-0.5 font-medium text-brand-blue-dark dark:text-brand-blue">
                                            {nombreDeCategoria(o)}
                                          </span>
                                        ))}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    title={np > 0 ? "Ver sus productos" : undefined}
                                    disabled={np === 0}
                                    onClick={(e) => {
                                      setSubFiltro(s.nombre);
                                      (e.currentTarget as HTMLElement).closest("td")?.querySelector('[data-seccion="productos-categoria"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    class="mr-auto whitespace-nowrap rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium sm:mr-0 text-neutral-600 transition-colors duration-200 enabled:hover:bg-neutral-200 disabled:cursor-default dark:bg-neutral-800 dark:text-neutral-400 dark:enabled:hover:bg-neutral-700"
                                  >
                                    {nt} {nt === 1 ? "tipo" : "tipos"} · {np} {np === 1 ? "producto" : "productos"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => abrirSubModal(s, c.slug)}
                                    class="shrink-0 rounded-md border border-brand-blue px-3 py-1 text-xs font-semibold text-brand-blue-dark transition-colors duration-200 hover:bg-brand-blue/10 dark:text-brand-blue"
                                  >
                                    Editar
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* Productos de la categoría: una sola lista, filtrable por subcategoría */}
                      <div data-seccion="productos-categoria" class="scroll-mt-40">
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Productos ({textoFiltro || subFiltro ? `${prodsVisibles.length} de ${prodsDeEsta.length}` : prodsDeEsta.length})
                          </p>
                          <button
                            type="button"
                            onClick={() => agregarProducto(c.slug, subFiltro ?? undefined)}
                            class="shrink-0 text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
                          >
                            + Agregar producto
                          </button>
                        </div>
                        {subsDeEsta.length > 0 && (
                          <div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar productos por subcategoría">
                            {[{ nombre: null as string | null, n: prodsDeEsta.length }, ...subsDeEsta.map((s) => ({ nombre: s.nombre as string | null, n: productosConSubcategoria(s).length }))].map((f) => {
                              const activo = subFiltro === f.nombre;
                              return (
                                <button
                                  type="button"
                                  key={f.nombre ?? "todas"}
                                  aria-pressed={activo}
                                  onClick={() => setSubFiltro(f.nombre)}
                                  class={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                                    activo
                                      ? "border-brand-blue bg-brand-blue text-white"
                                      : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-blue dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                                  } ${f.n === 0 && !activo ? "opacity-60" : ""}`}
                                >
                                  {f.nombre ?? "Todas"} <span class={activo ? "text-white/80" : "text-neutral-400"}>{f.n}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <ul class="mt-3 space-y-2">
                          {prodsDeEsta.length === 0 && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">Todavía no tiene productos.</p>
                          )}
                          {prodsDeEsta.length > 0 && prodsVisibles.length === 0 && (
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">
                              {subFiltro && !textoFiltro ? `Todavía no hay productos en "${subFiltro}".` : "Ningún producto coincide con el filtro."}
                            </p>
                          )}
                          {pagina(prodsVisibles, paginaProdsCategoria).map((p) => (
                            <li
                              key={p.sku}
                              class={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border p-2.5 sm:flex-nowrap dark:border-neutral-800 ${
                                p.activo ? "border-neutral-200" : "border-neutral-200 opacity-60 dark:border-neutral-800"
                              }`}
                            >
                              {p.imagen ? (
                                <img src={p.imagen} alt="" class="h-10 w-10 flex-none rounded-md object-cover" />
                              ) : (
                                <div class="h-10 w-10 flex-none rounded-md bg-neutral-200 dark:bg-neutral-800" />
                              )}
                              <div class="min-w-0 flex-1 basis-[calc(100%-3.25rem)] sm:basis-auto">
                                <p class="flex min-w-0 items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  <span class="truncate">{p.nombre}</span>
                                  {!esPrincipalEn(p, c.slug) && <span class="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" title={`Categoría principal: ${nombreDeCategoria(p.categoria_slug)} / ${p.subcategoria}`}>Adicional</span>}
                                </p>
                                <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  <span class="text-neutral-700 dark:text-neutral-300">
                                    {ubicacionesEnCategoria(p, c.slug).map((u) => u.subcategoria + (u.tipo ? ` › ${u.tipo}` : "")).join(" · ")}
                                  </span>
                                  {" · "}
                                  {p.sku} · {p.marca} · {p.precio != null ? `S/ ${Number(p.precio).toFixed(2)}` : "Sin precio"}
                                </p>
                              </div>
                              <div class="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
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
                              </div>
                            </li>
                          ))}
                        </ul>
                        <Paginacion pagina={paginaProdsCategoria} setPagina={setPaginaProdsCategoria} total={prodsVisibles.length} porPagina={POR_PAGINA_LISTA} nombre="productos" />
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
            <div class="border-t border-neutral-200 px-4 pb-3 dark:border-neutral-800">
              <Paginacion {...pagCategorias} nombre="categorías" />
            </div>
          </div>
        ))}

        {vista === "productos" && (
          <div class="mb-3 flex flex-wrap gap-2">
            <select
              id="filtro-categoria-admin"
              aria-label="Filtrar por categoría"
              value={filtroCategoria}
              onInput={(e) => setFiltroCategoria((e.target as HTMLSelectElement).value)}
              class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option value={c.slug}>
                  {c.nombre} ({productosDe(c.slug).length})
                </option>
              ))}
            </select>
            <select
              id="filtro-estado-admin"
              aria-label="Filtrar por estado"
              value={filtroEstado}
              onInput={(e) => setFiltroEstado((e.target as HTMLSelectElement).value as typeof filtroEstado)}
              class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Activos e inactivos</option>
              <option value="activo">Solo activos</option>
              <option value="inactivo">Solo inactivos</option>
            </select>
            {(filtroCategoria || filtroEstado) && (
              <button
                type="button"
                onClick={() => {
                  setFiltroCategoria("");
                  setFiltroEstado("");
                }}
                class="text-xs font-semibold text-brand-blue-dark hover:underline dark:text-brand-blue"
              >
                Quitar filtros
              </button>
            )}
          </div>
        )}

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
                    {pagProductos.visibles.map((p) => (
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
                          {adicionalesDe(p.sku).length > 0 && (
                            <span class="mt-1 flex flex-wrap gap-1">
                              {adicionalesDe(p.sku)
                                .map((u) => u.categoria_slug)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .map((slug) => (
                                  <span
                                    key={slug}
                                    title={`También se muestra en ${nombreDeCategoria(slug)} / ${adicionalesDe(p.sku).filter((u) => u.categoria_slug === slug).map((u) => u.subcategoria).join(", ")}`}
                                    class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                  >
                                    + {nombreDeCategoria(slug)}
                                  </span>
                                ))}
                            </span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {p.subcategoria}
                          {p.tipo && <span class="block text-xs text-neutral-500 dark:text-neutral-500">{p.tipo}</span>}
                        </td>
                        <td class="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-400">{p.precio != null ? `S/ ${Number(p.precio).toFixed(2)}` : "Sin precio"}</td>
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

              <Paginacion {...pagProductos} nombre="productos" />
            </>
          )
        )}
      </div>

      {subModal && (
        <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4">
          <form
            id="form-subcategoria"
            onSubmit={guardarSubModal}
            class="my-4 max-h-[92vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:my-8 sm:p-6 dark:bg-neutral-900"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-base font-semibold text-neutral-900 dark:text-white">{subModal.original ? "Editar subcategoría" : "Nueva subcategoría"}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">Nada se guarda hasta pulsar "Guardar".</p>
              </div>
              <button
                type="button"
                onClick={() => setSubModal(null)}
                aria-label="Cerrar sin guardar"
                class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div>
              <label for="nombre-subcategoria" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Nombre
              </label>
              <input
                id="nombre-subcategoria"
                type="text"
                required
                autofocus={!subModal.original}
                value={subModal.nombre}
                onInput={(e) => setSubModal({ ...subModal, nombre: (e.target as HTMLInputElement).value })}
                placeholder="Ej: Cubre Volantes"
                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              {subModal.original && subModal.nombre.trim() && subModal.nombre.trim() !== subModal.original && (
                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {categoriasConSubcategoria(subModal.original).length > 1
                    ? "Se renombra en todas sus categorías y en los productos que la usan."
                    : "Se renombra también en los productos que la usan."}
                </p>
              )}
            </div>

            <fieldset data-seccion="categorias-subcategoria">
              <legend class="text-sm font-medium text-neutral-700 dark:text-neutral-300">¿En qué categorías aparece?</legend>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Marca todas las que correspondan. Tendrá los mismos tipos en todas.</p>
              <ul class="mt-2 grid gap-1.5 sm:grid-cols-2">
                {categorias.map((c) => {
                  const usados = subModal.original ? usoSubEn(c.slug, subModal.original) : 0;
                  const marcada = subModal.categorias.includes(c.slug);
                  const bloqueada = marcada && usados > 0;
                  return (
                    <li key={c.slug}>
                      <label
                        class={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors duration-200 ${
                          marcada
                            ? "border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700"
                        } ${bloqueada ? "cursor-not-allowed" : "cursor-pointer"}`}
                        title={bloqueada ? "Para quitarla de aquí, primero cambia de subcategoría a sus productos." : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={bloqueada}
                          onChange={() => alternarCategoriaSubModal(c.slug)}
                          class="mt-0.5 h-4 w-4 flex-none accent-brand-blue"
                        />
                        <span class="min-w-0">
                          <span class="block text-neutral-800 dark:text-neutral-200">
                            {c.nombre}
                            {c.activo === false ? " (inactiva)" : ""}
                          </span>
                          {usados > 0 && (
                            <span class="block text-xs text-neutral-500 dark:text-neutral-400">
                              {usados} {usados === 1 ? "producto la usa" : "productos la usan"} aquí
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div data-seccion="tipos-subcategoria">
              <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tipos de producto <span class="font-normal text-neutral-500 dark:text-neutral-400">(opcional)</span>
              </p>
              {subModal.tipos.length > 0 ? (
                <ul class="mt-2 flex flex-wrap gap-1.5">
                  {subModal.tipos.map((t) => (
                    <li key={t} class="inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-2.5 pr-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {t}
                      <button
                        type="button"
                        onClick={() => setSubModal({ ...subModal, tipos: subModal.tipos.filter((x) => x !== t) })}
                        aria-label={`Quitar tipo ${t}`}
                        class="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Sin tipos todavía.</p>
              )}
              <div class="mt-2 flex gap-2">
                <input
                  type="text"
                  aria-label="Nuevo tipo de producto"
                  placeholder="Nuevo tipo..."
                  value={subModal.nuevoTipo}
                  onInput={(e) => setSubModal({ ...subModal, nuevoTipo: (e.target as HTMLInputElement).value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarTipoSubModal();
                    }
                  }}
                  class="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={agregarTipoSubModal}
                  class="shrink-0 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Agregar tipo
                </button>
              </div>
              {(() => {
                const original = subModal.original;
                if (!original) return null;
                const quitados = Array.from(
                  new Set(categoriasConSubcategoria(original).flatMap((c) => tiposDe(c, original).map((t) => t.nombre))),
                ).filter((t) => !subModal.tipos.includes(t) && usoTipo(original, t) > 0);
                return quitados.length > 0 ? (
                  <p class="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Al guardar se quitará{quitados.length > 1 ? "n" : ""} {quitados.map((t) => `"${t}" (${usoTipo(original, t)} producto${usoTipo(original, t) !== 1 ? "s" : ""})`).join(", ")}. Esos productos no se modifican.
                  </p>
                ) : null;
              })()}
            </div>

            {errorSubModal && <p class="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{errorSubModal}</p>}

            <div class="sticky -bottom-4 -mx-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6 dark:border-neutral-800 dark:bg-neutral-900">
              {subModal.original && (
                <button
                  type="button"
                  onClick={borrarDesdeSubModal}
                  class="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Borrar subcategoría
                </button>
              )}
              <div class="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubModal(null)}
                  class="rounded-md px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSubModal}
                  class="rounded-md bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:opacity-50"
                >
                  {guardandoSubModal ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {prodFormAbierto && prodFormCategoriaSlug !== null && (
        <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4">
          <form
            id="form-producto"
            onSubmit={guardarProducto}
            class="my-4 max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white px-4 pb-0 shadow-xl sm:my-8 sm:px-6 dark:bg-neutral-900"
          >
            <div class="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:-mx-6 sm:px-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div class="min-w-0">
                <p class="truncate text-base font-semibold text-neutral-900 dark:text-white">
                  {prodEditandoSku ? `Editar producto · ${prodEditandoSku}` : "Nuevo producto"}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {prodFormCategoriaSlug ? `Categoría: ${nombreDeCategoria(prodFormCategoriaSlug)}` : "Empieza eligiendo la categoría"}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarProducto}
                aria-label="Cerrar sin guardar"
                class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <p class="text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:text-brand-blue">1. ¿Dónde se muestra?</p>
            <div class="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-3 dark:bg-brand-blue/10" data-seccion="ubicacion-producto">
            <p class="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span class="rounded bg-brand-blue px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Principal</span>
              Su categoría de origen: define la ruta de la ficha del producto.
            </p>
            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="categoria-producto">
                  Categoría
                </label>
                <select
                  id="categoria-producto"
                  required
                  value={prodFormCategoriaSlug}
                  onInput={(e) => elegirCategoriaProducto((e.target as HTMLSelectElement).value)}
                  class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="" disabled>
                    Elegir categoría
                  </option>
                  {categorias.map((c) => (
                    <option value={c.slug}>
                      {c.nombre}
                      {c.activo === false ? " (inactiva)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Subcategoría</label>
                <select
                  required={!escribiendoNuevaSub}
                  disabled={!prodFormCategoriaSlug}
                  value={escribiendoNuevaSub ? NUEVA_SUBCATEGORIA : prodForm.subcategoria}
                  onInput={(e) => elegirSubcategoriaProducto((e.target as HTMLSelectElement).value)}
                  class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="" disabled>
                    {prodFormCategoriaSlug ? "Elegir subcategoría" : "Primero elige la categoría"}
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
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="tipo-producto">
                  Tipo de producto (opcional)
                </label>
                <select
                  id="tipo-producto"
                  disabled={!prodForm.subcategoria.trim()}
                  value={escribiendoNuevoTipo ? NUEVO_TIPO : prodForm.tipo}
                  onInput={(e) => elegirTipoProducto((e.target as HTMLSelectElement).value)}
                  class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="">{prodForm.subcategoria.trim() ? "Sin tipo" : "Primero elige la subcategoría"}</option>
                  {tiposDe(prodFormCategoriaSlug, prodForm.subcategoria.trim()).map((t) => (
                    <option value={t.nombre}>{t.nombre}</option>
                  ))}
                  {/* Un tipo que el producto ya tenía pero que no está en la lista. */}
                  {prodForm.tipo &&
                    !escribiendoNuevoTipo &&
                    !tiposDe(prodFormCategoriaSlug, prodForm.subcategoria.trim()).some((t) => t.nombre === prodForm.tipo) && (
                      <option value={prodForm.tipo}>{prodForm.tipo}</option>
                    )}
                  <option value={NUEVO_TIPO}>+ Nuevo tipo...</option>
                </select>
                {escribiendoNuevoTipo && (
                  <input
                    type="text"
                    required
                    placeholder="Nombre del nuevo tipo"
                    value={prodForm.tipo}
                    onInput={(e) => campoProducto("tipo", (e.target as HTMLInputElement).value)}
                    class="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                )}
              </div>
            </div>
              {ubicaciones !== null && (() => {
                const subPrincipal = prodForm.subcategoria.trim();
                const sugeridas = subPrincipal
                  ? categoriasConSubcategoria(subPrincipal).filter(
                      (c) => c !== prodFormCategoriaSlug && !ubicacionesForm.some((u) => u.categoria_slug === c && u.subcategoria === subPrincipal),
                    )
                  : [];
                return (
                  <div class="mt-3 border-t border-brand-blue/20 pt-3" data-seccion="categorias-adicionales">
                    <p class="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Adicional</span>
                      {ubicacionesForm.length > 0 ? "También se muestra en:" : "¿También debe verse en otra categoría? (opcional)"}
                    </p>
                    {ubicacionesForm.map((u, i) => (
                      <div key={i} class="mt-2 grid grid-cols-[1fr_auto] gap-2 rounded-md border border-neutral-200 bg-white p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:border-0 sm:bg-transparent sm:p-0 dark:border-neutral-800 dark:bg-neutral-900 sm:dark:bg-transparent">
                      <select
                        aria-label={`Categoría adicional ${i + 1}`}
                        value={u.categoria_slug}
                        onInput={(e) => cambiarFilaUbicacion(i, { categoria_slug: (e.target as HTMLSelectElement).value })}
                        class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="" disabled>
                          Categoría
                        </option>
                        {categorias.map((c) => (
                          <option value={c.slug}>{c.nombre}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => quitarFilaUbicacion(i)}
                        aria-label={`Quitar categoría adicional ${i + 1}`}
                        class="row-span-3 flex h-9 w-9 items-center justify-center self-start rounded-md text-neutral-500 hover:bg-red-100 hover:text-red-600 sm:order-last sm:row-span-1 dark:hover:bg-red-900/40"
                      >
                        ✕
                      </button>
                      <select
                        aria-label={`Subcategoría adicional ${i + 1}`}
                        disabled={!u.categoria_slug}
                        value={u.subcategoria}
                        onInput={(e) => cambiarFilaUbicacion(i, { subcategoria: (e.target as HTMLSelectElement).value })}
                        class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">{u.categoria_slug ? "Subcategoría" : "Primero la categoría"}</option>
                        {subcategoriasDe(u.categoria_slug).map((sc) => (
                          <option value={sc.nombre}>{sc.nombre}</option>
                        ))}
                      </select>
                      <select
                        aria-label={`Tipo adicional ${i + 1}`}
                        disabled={!u.subcategoria}
                        value={u.tipo}
                        onInput={(e) => cambiarFilaUbicacion(i, { tipo: (e.target as HTMLSelectElement).value })}
                        class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">Sin tipo</option>
                        {tiposDe(u.categoria_slug, u.subcategoria).map((t) => (
                          <option value={t.nombre}>{t.nombre}</option>
                        ))}
                      </select>
                      </div>
                    ))}
                    {sugeridas.length > 0 && (
                      <p class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        "{subPrincipal}" también está en:
                        {sugeridas.map((c) => (
                          <button
                            type="button"
                            onClick={() =>
                              agregarFilaUbicacion({
                                categoria_slug: c,
                                subcategoria: subPrincipal,
                                tipo: tiposDe(c, subPrincipal).some((t) => t.nombre === prodForm.tipo) ? prodForm.tipo : "",
                              })
                            }
                            class="rounded-full bg-brand-blue/10 px-2 py-0.5 font-medium text-brand-blue-dark hover:bg-brand-blue/20 dark:text-brand-blue"
                          >
                            + {nombreDeCategoria(c)}
                          </button>
                        ))}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => agregarFilaUbicacion()}
                      class="mt-2 rounded-md border border-brand-blue bg-white px-2.5 py-1 text-xs font-semibold text-brand-blue-dark transition-colors duration-200 hover:bg-brand-blue/10 dark:bg-neutral-900 dark:text-brand-blue"
                    >
                      + Mostrar también en otra categoría
                    </button>
                  </div>
                );
              })()}
            </div>

            <p class="border-t border-neutral-200 pt-4 text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:border-neutral-800 dark:text-brand-blue">
              2. Datos del producto
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <CampoTexto label="SKU" value={prodForm.sku} onInput={(v) => campoProducto("sku", v)} required />
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


            <p class="border-t border-neutral-200 pt-4 text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:border-neutral-800 dark:text-brand-blue">
              3. Fotos y video
            </p>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="fotos-producto">
                Fotos
              </label>
              <GestorFotos id="fotos-producto" fotos={fotosProducto} onCambiar={setFotosProducto} />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="video-producto">
                Video (opcional)
              </label>
              <SelectorArchivo
                id="video-producto"
                accept="video/*"
                tipo="video"
                archivo={archivoVideoProducto}
                onElegir={setArchivoVideoProducto}
                actual={productos.find((p) => p.sku === prodEditandoSku)?.video_url}
                quitarActual={quitarVideo}
                onQuitarActual={setQuitarVideo}
              />
            </div>

            <p class="border-t border-neutral-200 pt-4 text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:border-neutral-800 dark:text-brand-blue">
              4. Descripción y ficha técnica
            </p>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="descripcion-producto">Descripción</label>
              <textarea
                id="descripcion-producto"
                required
                rows={8}
                value={prodForm.descripcion}
                onInput={(e) => campoProducto("descripcion", (e.target as HTMLTextAreaElement).value)}
                class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Cada línea es un párrafo. Empieza una línea con <strong>-</strong> para hacer una viñeta. Una línea corta que termina en{" "}
                <strong>:</strong> (por ejemplo "Beneficios:") sale como subtítulo.
              </p>
              {prodForm.descripcion.trim() && (
                <div data-vista-previa-descripcion class="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60">
                  <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Vista previa</p>
                  <DescripcionProducto texto={prodForm.descripcion} compacto />
                </div>
              )}
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
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="ficha-tecnica">
                Ficha técnica en PDF (opcional)
              </label>
              <SelectorArchivo
                id="ficha-tecnica"
                accept="application/pdf"
                tipo="pdf"
                archivo={archivoFichaTecnica}
                onElegir={setArchivoFichaTecnica}
                actual={productos.find((p) => p.sku === prodEditandoSku)?.ficha_tecnica_url}
                quitarActual={quitarFichaTecnica}
                onQuitarActual={setQuitarFichaTecnica}
              />
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">En la ficha del producto aparece el botón "Descargar ficha técnica (PDF)".</p>
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

            <p class="border-t border-neutral-200 pt-4 text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:border-neutral-800 dark:text-brand-blue">
              5. Visibilidad
            </p>
            <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={prodForm.destacado}
                onChange={(e) => campoProducto("destacado", (e.target as HTMLInputElement).checked)}
              />
              Mostrar en "Productos destacados" de la página de inicio
            </label>

            <div class="sticky bottom-0 -mx-4 border-t border-neutral-200 bg-white px-4 py-3 sm:-mx-6 sm:px-6 dark:border-neutral-800 dark:bg-neutral-900">
              {errorProducto && <p class="mb-2 text-sm text-red-600 dark:text-red-400">{errorProducto}</p>}
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={cancelarProducto}
                  class="rounded-md px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  class="flex-1 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoProducto ? "Guardando..." : prodEditandoSku ? "Guardar cambios" : "Agregar producto"}
                </button>
              </div>
            </div>
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
                {confirmacion.titulo.startsWith("Quitar") ? "Quitar" : "Borrar"}
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
      {avisoBreve}
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
        // Precios en soles con céntimos (ej. 55.90): sin step, el navegador
        // solo acepta enteros y bloqueaba el guardado del producto.
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </div>
  );
}
