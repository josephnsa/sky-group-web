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
  subcategoria: string;
  nombre: string;
  marca: string;
  precio: number; // soles, sin símbolo
  precioAnterior?: number; // si hay descuento
  imagen: string; // ruta dentro de /public, URL de Supabase Storage, o el placeholder
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

const IMAGEN_PLACEHOLDER = "/images/placeholder-producto.svg";

async function cargarDatos() {
  const [{ data: filasCategorias, error: errorCategorias }, { data: filasProductos, error: errorProductos }] =
    await Promise.all([
      // El sitio público solo muestra categorías/productos activos — algo
      // "inactivado" desde el panel de admin sigue existiendo (no se borra),
      // solo deja de listarse/ser visible para los clientes.
      supabase.from("categorias").select("*").eq("activo", true).order("orden"),
      supabase.from("productos").select("*").eq("activo", true),
    ]);

  // No se usa `throw` acá a propósito: si Supabase todavía no tiene las
  // tablas creadas (o hay un problema pasajero de red), el sitio entero
  // se caía con un error 500 en cada página — mucho peor que mostrar un
  // catálogo vacío temporalmente. Se degrada, no se rompe.
  if (errorCategorias) console.error("Error cargando categorías desde Supabase:", errorCategorias.message);
  if (errorProductos) console.error("Error cargando productos desde Supabase:", errorProductos.message);

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
      subcategoria: f.subcategoria,
      nombre: f.nombre,
      marca: f.marca,
      precio: Number(f.precio),
      precioAnterior: f.precio_anterior != null ? Number(f.precio_anterior) : undefined,
      imagen: f.imagen ?? IMAGEN_PLACEHOLDER,
      descripcion: f.descripcion,
      destacado: f.destacado ?? false,
      compatibilidad: f.compatibilidad ?? undefined,
      especificaciones: f.especificaciones ?? undefined,
    }));

  return { categorias, productos };
}

const { categorias: categoriasCache, productos } = await cargarDatos();

export { productos };

export function getCategorias() {
  return categoriasCache.map((cat) => ({
    categoria: cat.nombre,
    slug: cat.slug,
    subcategorias: Array.from(
      new Set(productos.filter((p) => p.categoria === cat.nombre).map((p) => p.subcategoria)),
    ),
  }));
}

export function getProductosPorCategoria(categoriaSlug: string) {
  return productos.filter((p) => slugify(p.categoria) === categoriaSlug);
}

export function getProductoPorSku(sku: string) {
  return productos.find((p) => p.sku === sku);
}

export function getDestacados() {
  return productos.filter((p) => p.destacado);
}

// Palabras clave por categoría para que la imagen temporal (mientras un
// producto no tiene foto propia subida desde el panel de admin) sea del
// rubro correcto, no una foto genérica de cualquier cosa.
const PALABRAS_CLAVE_POR_CATEGORIA: Record<string, string> = {
  Iluminación: "car,led",
  "Accesorios Tuning y Decoración": "car,tuning",
  "Auxilio Vehicular": "car,emergency",
  Remolque: "car,towing",
  "Limpieza y Pulido": "car,detailing",
  "Cintas y Adhesivos": "tape,tool",
  "Equipamiento Exterior": "car,roofrack",
  "Para Trabajo y Negocio": "mechanic,tools",
  "Molduras y Protectores": "car,door",
  Seguros: "car,wheel",
  "Interior y Confort": "car,interior",
};

function hashSimple(texto: string) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Mientras un producto no tenga foto propia (campo `imagen` vacío desde el
// panel de admin), se usa una imagen temporal orientada al rubro según la
// categoría, consistente por SKU (mismo producto = misma imagen siempre).
export function getImagenProducto(p: Producto) {
  if (p.imagen && p.imagen !== IMAGEN_PLACEHOLDER) return p.imagen;
  const palabras = PALABRAS_CLAVE_POR_CATEGORIA[p.categoria] ?? "car,parts";
  const lock = hashSimple(p.sku);
  return `https://loremflickr.com/600/600/${palabras}?lock=${lock}`;
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
