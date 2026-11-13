// Fuente de datos del catálogo — ahora viene de Supabase (tablas `categorias`
// y `productos`, ver docs/panel-administracion.md) en vez de un array
// hardcodeado. Se trae UNA vez, con top-level `await`, al cargar este módulo
// — como las importaciones de ES modules resuelven completo (incluyendo sus
// propios top-level `await`) antes de que seguir el módulo que las importa,
// ninguna página/componente que ya usaba `productos`/`getCategorias()` de
// forma síncrona necesitó cambiar.
import { supabase } from "../lib/supabase";

export interface Producto {
  sku: string;
  categoria: string;
  // Slug real de la categoría (columna categoria_slug). Las páginas de
  // categoría filtran por esto y no por slugify(nombre): si desde el admin se
  // renombra una categoría, el slug no cambia y antes sus productos
  // desaparecían de /catalogo/<slug>.
  categoriaSlug: string;
  subcategoria: string;
  // Tercer nivel del Excel del cliente ("PRODUCTOS (SUB SUB)"), opcional.
  tipo?: string;
  nombre: string;
  marca: string;
  // La mayoría de productos no tiene precio cargado (se cotiza por
  // WhatsApp) — opcional a propósito, no es un dato obligatorio del
  // catálogo.
  precio?: number; // soles, sin símbolo
  precioAnterior?: number; // si hay descuento (solo tiene sentido si hay precio)
  imagen: string; // ruta dentro de /public, URL de Supabase Storage, o el placeholder
  imagenes?: string[]; // fotos adicionales (galería) — la primera de `imagen` no se repite acá
  video?: string; // URL de video del producto (Supabase Storage), opcional
  enlaceConoceMas?: string; // botón "¡Conoce más!": TikTok/YouTube se abre en modal, otro enlace en pestaña nueva
  fichaTecnicaUrl?: string; // PDF descargable con la ficha técnica, opcional
  descripcion: string;
  destacado?: boolean;
  compatibilidad?: string[]; // modelos/vehículos compatibles, ej. "Toyota Yaris 2015-2020"
  especificaciones?: { etiqueta: string; valor: string }[]; // ficha técnica
}

interface CategoriaFila {
  slug: string;
  nombre: string;
  foto_url: string | null;
  orden: number;
}

export interface DiapositivaCarrusel {
  id: string;
  imagen_url: string;
  titulo: string | null;
  enlace: string | null;
}

const IMAGEN_PLACEHOLDER = "/images/placeholder-producto.svg";

async function cargarDatos() {
  const [
    { data: filasCategorias, error: errorCategorias },
    { data: filasProductos, error: errorProductos },
    { data: filasCarrusel, error: errorCarrusel },
    { data: filasSubcategorias },
    { data: filasTipos },
  ] = await Promise.all([
    // El sitio público solo muestra categorías/productos activos — algo
    // "inactivado" desde el panel de admin sigue existiendo (no se borra),
    // solo deja de listarse/ser visible para los clientes.
    supabase.from("categorias").select("*").eq("activo", true).order("orden"),
    supabase.from("productos").select("*").eq("activo", true),
    // El carrusel se trae acá (build-time), igual que categorías/productos,
    // en vez de con un fetch del lado del cliente dentro de PromoCarousel:
    // antes el carrusel viajaba vacío en el HTML y recién mostraba una
    // imagen real después de descargar JS (Supabase + framer-motion, ~95KB
    // gzip) y esperar una ida y vuelta de red al montar — la sección más
    // visible de Home se veía en blanco varios cientos de ms/segundos. Con
    // esto el carrusel ya sale con su primera imagen en el HTML inicial. La
    // contrapartida (igual que ya pasa con categorías/productos) es que un
    // cambio del admin necesita un rebuild del sitio para publicarse.
    supabase.from("carousel_slides").select("id, imagen_url, titulo, enlace").eq("activo", true).order("orden"),
    // Solo para respetar el orden del Excel en el menú (subcategorías y
    // tipos). Si la tabla tipos_producto todavía no existe (migración sin
    // correr), el error se ignora y se ordena alfabéticamente.
    supabase.from("subcategorias").select("categoria_slug, nombre, orden").order("orden"),
    supabase.from("tipos_producto").select("categoria_slug, subcategoria, nombre, orden").order("orden"),
  ]);

  // No se usa `throw` acá a propósito: si Supabase todavía no tiene las
  // tablas creadas (o hay un problema pasajero de red), el sitio entero
  // se caía con un error 500 en cada página — mucho peor que mostrar un
  // catálogo vacío temporalmente. Se degrada, no se rompe.
  if (errorCategorias) console.error("Error cargando categorías desde Supabase:", errorCategorias.message);
  if (errorProductos) console.error("Error cargando productos desde Supabase:", errorProductos.message);
  if (errorCarrusel) console.error("Error cargando carrusel desde Supabase:", errorCarrusel.message);

  const categorias = (filasCategorias ?? []) as CategoriaFila[];
  const nombrePorSlug = new Map(categorias.map((c) => [c.slug, c.nombre] as const));

  // Si la categoría de un producto está desactivada (o no existe), el
  // producto tampoco se muestra — evita el caso raro de un producto "suelto"
  // apuntando a una categoría que ya no aparece en ningún lado del sitio.
  const productos: Producto[] = (filasProductos ?? [])
    .filter((f: any) => nombrePorSlug.has(f.categoria_slug))
    .map((f: any) => ({
      sku: f.sku,
      categoria: nombrePorSlug.get(f.categoria_slug) ?? f.categoria_slug,
      categoriaSlug: f.categoria_slug,
      subcategoria: f.subcategoria,
      tipo: f.tipo?.trim() || undefined,
      nombre: f.nombre,
      marca: f.marca,
      precio: f.precio != null ? Number(f.precio) : undefined,
      precioAnterior: f.precio_anterior != null ? Number(f.precio_anterior) : undefined,
      imagen: f.imagen ?? IMAGEN_PLACEHOLDER,
      imagenes: f.imagenes ?? undefined,
      video: f.video_url ?? undefined,
      enlaceConoceMas: f.enlace_conoce_mas?.trim() || undefined,
      fichaTecnicaUrl: f.ficha_tecnica_url?.trim() || undefined,
      descripcion: f.descripcion,
      destacado: f.destacado ?? false,
      compatibilidad: f.compatibilidad ?? undefined,
      especificaciones: f.especificaciones ?? undefined,
    }));

  const carrusel = (filasCarrusel ?? []) as DiapositivaCarrusel[];

  const ordenSub = new Map(((filasSubcategorias ?? []) as any[]).map((s) => [`${s.categoria_slug}|${s.nombre}`, s.orden as number]));
  const ordenTipo = new Map(((filasTipos ?? []) as any[]).map((t) => [`${t.categoria_slug}|${t.subcategoria}|${t.nombre}`, t.orden as number]));

  return { categorias, productos, carrusel, ordenSub, ordenTipo };
}

const { categorias: categoriasCache, productos, carrusel: carruselSlides, ordenSub, ordenTipo } = await cargarDatos();

export { productos, carruselSlides };

function ordenar<T>(lista: T[], clave: (x: T) => string, orden: Map<string, number>, nombre: (x: T) => string) {
  return [...lista].sort((a, b) => {
    const oa = orden.get(clave(a)) ?? 999;
    const ob = orden.get(clave(b)) ?? 999;
    return oa !== ob ? oa - ob : nombre(a).localeCompare(nombre(b), "es");
  });
}

export interface SubcategoriaPublica {
  nombre: string;
  tipos: string[];
}

// Solo se listan en el sitio las categorías, subcategorías y tipos que tienen
// productos activos: la estructura completa del Excel (con categorías aún
// vacías como Motos o Camiones) vive en el admin, y cada rama aparece sola
// en la web en cuanto se le carga su primer producto (y se republica).
export function getCategorias() {
  return categoriasCache
    .map((cat) => {
      const suyos = productos.filter((p) => p.categoriaSlug === cat.slug);
      const nombresSub = Array.from(new Set(suyos.map((p) => p.subcategoria)));
      const arbol: SubcategoriaPublica[] = ordenar(nombresSub, (s) => `${cat.slug}|${s}`, ordenSub, (s) => s).map((sub) => ({
        nombre: sub,
        tipos: ordenar(
          Array.from(new Set(suyos.filter((p) => p.subcategoria === sub && p.tipo).map((p) => p.tipo!))),
          (t) => `${cat.slug}|${sub}|${t}`,
          ordenTipo,
          (t) => t,
        ),
      }));
      return {
        categoria: cat.nombre,
        slug: cat.slug,
        cantidad: suyos.length,
        subcategorias: arbol.map((a) => a.nombre),
        arbol,
      };
    })
    .filter((c) => c.cantidad > 0);
}

export function getProductosPorCategoria(categoriaSlug: string) {
  return productos.filter((p) => p.categoriaSlug === categoriaSlug);
}

export function getSlugCategoria(nombreCategoria: string) {
  return categoriasCache.find((c) => c.nombre === nombreCategoria)?.slug ?? slugify(nombreCategoria);
}

export function getProductoPorSku(sku: string) {
  return productos.find((p) => p.sku === sku);
}

export function getDestacados() {
  return productos.filter((p) => p.destacado);
}

// Mientras un producto no tenga foto propia (campo `imagen` vacío desde el
// panel de admin), se muestra la foto de su categoría (la misma que ya usa
// la grilla de Home/mega-menú, un archivo local en public/images/categorias/)
// en vez de pedir una imagen a un servicio externo (LoremFlickr) en cada
// visita — eso agregaba ~900ms reales a cada carga de una ficha de producto
// (medido: 981ms con la imagen externa vs. 71ms con un asset local), y
// afecta hoy al 100% del catálogo porque todavía no hay fotos reales
// subidas. Se pierde la variedad "una foto distinta por SKU", pero se gana
// velocidad real y no depender de un tercero (que además a veces devolvía
// fotos con marcas de agua o gente real, nada ideal para un sitio real).
export function getImagenProducto(p: Producto) {
  if (p.imagen && p.imagen !== IMAGEN_PLACEHOLDER) return p.imagen;
  return getFotoCategoria(p.categoria) ?? IMAGEN_PLACEHOLDER;
}

export function getFotoCategoria(categoria: string): string | null {
  return categoriasCache.find((c) => c.nombre === categoria)?.foto_url ?? null;
}

export function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
