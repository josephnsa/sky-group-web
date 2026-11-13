import { supabase } from "./supabase";

export interface CategoriaAdmin {
  slug: string;
  nombre: string;
  foto_url: string | null;
  orden: number;
  activo: boolean;
}

export interface SubcategoriaAdmin {
  id: string;
  categoria_slug: string;
  nombre: string;
  orden: number;
}

// Tercer nivel del Excel del cliente ("tipo de producto"), dentro de una
// subcategoría. Tabla creada por docs/migracion-categorias-excel.sql.
export interface TipoAdmin {
  id: string;
  categoria_slug: string;
  subcategoria: string;
  nombre: string;
  orden: number;
}

export interface ProductoAdmin {
  sku: string;
  categoria_slug: string;
  subcategoria: string;
  nombre: string;
  marca: string;
  precio: number | null;
  precio_anterior: number | null;
  imagen: string | null;
  imagenes: string[] | null;
  video_url: string | null;
  // Opcional en el tipo: la columna se agrega con docs/migracion-enlace-conoce-mas.sql.
  enlace_conoce_mas?: string | null;
  // Opcionales en el tipo: las columnas se agregan con docs/migracion-categorias-excel.sql.
  tipo?: string | null;
  ficha_tecnica_url?: string | null;
  descripcion: string;
  destacado: boolean;
  activo: boolean;
  compatibilidad: string[] | null;
  especificaciones: { etiqueta: string; valor: string }[] | null;
}

export interface CarouselSlideAdmin {
  id: string;
  imagen_url: string;
  titulo: string | null;
  enlace: string | null;
  orden: number;
  activo: boolean;
}

export interface AdminUsuario {
  id: string;
  email: string;
  creado_en: string;
}

// Verifica sesión + pertenencia a `admins` en un solo lugar, reusado por las
// islas del panel — cada una lo llama al montar para decidir qué mostrar
// (login / sin acceso / formulario real). La seguridad de verdad la hacen
// las políticas RLS de Supabase, esto es solo para la experiencia visual.
//
// Se compara por correo (no por user_id) para poder pre-autorizar a alguien
// como admin ANTES de que haya iniciado sesión alguna vez — ver
// docs/migracion-admins-por-email.sql.
export async function estadoDeAcceso(): Promise<"sin-sesion" | "sin-acceso" | "admin"> {
  const { data: sesion } = await supabase.auth.getSession();
  const usuario = sesion.session?.user;
  if (!usuario?.email) return "sin-sesion";

  const { data } = await supabase
    .from("admins")
    .select("id")
    .ilike("email", usuario.email)
    .maybeSingle();
  return data ? "admin" : "sin-acceso";
}

// Correo de la persona actualmente logueada — lo usa el panel de gestión de
// admins para no dejar que alguien se quite el acceso a sí mismo por error.
export async function correoActual(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

// Sube un archivo al bucket público "imagenes" y devuelve su URL pública.
// `carpeta` agrupa por tipo (categorias/productos/carrusel) dentro del mismo
// bucket, para no mezclar todo suelto en la raíz.
export async function subirImagen(archivo: File, carpeta: string): Promise<string> {
  const ext = archivo.name.split(".").pop();
  const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("imagenes").upload(ruta, archivo);
  if (error) throw error;
  const { data } = supabase.storage.from("imagenes").getPublicUrl(ruta);
  return data.publicUrl;
}

export const categoriasAdmin = {
  async listar(): Promise<CategoriaAdmin[]> {
    const { data, error } = await supabase.from("categorias").select("*").order("orden");
    if (error) throw error;
    return data;
  },
  async crear(categoria: CategoriaAdmin) {
    const { error } = await supabase.from("categorias").insert(categoria);
    if (error) throw error;
  },
  async actualizar(slug: string, cambios: Partial<CategoriaAdmin>) {
    const { error } = await supabase.from("categorias").update(cambios).eq("slug", slug);
    if (error) throw error;
  },
  async borrar(slug: string) {
    const { error } = await supabase.from("categorias").delete().eq("slug", slug);
    if (error) throw error;
  },
};

export const subcategoriasAdmin = {
  async listar(): Promise<SubcategoriaAdmin[]> {
    const { data, error } = await supabase.from("subcategorias").select("*").order("orden");
    if (error) throw error;
    return data;
  },
  async crear(subcategoria: Omit<SubcategoriaAdmin, "id">) {
    const { error } = await supabase.from("subcategorias").insert(subcategoria);
    if (error) throw error;
  },
  async renombrar(id: string, nombre: string) {
    const { error } = await supabase.from("subcategorias").update({ nombre }).eq("id", id);
    if (error) throw error;
  },
  async borrar(id: string) {
    const { error } = await supabase.from("subcategorias").delete().eq("id", id);
    if (error) throw error;
  },
};

export const tiposAdmin = {
  // Si la migración todavía no se corrió, la tabla no existe: se devuelve
  // una lista vacía para que el panel siga funcionando como antes.
  async listar(): Promise<TipoAdmin[]> {
    const { data, error } = await supabase.from("tipos_producto").select("*").order("orden");
    if (error) return [];
    return data;
  },
  async crear(tipo: Omit<TipoAdmin, "id">) {
    const { error } = await supabase.from("tipos_producto").insert(tipo);
    if (error) throw error;
  },
  async borrar(id: string) {
    const { error } = await supabase.from("tipos_producto").delete().eq("id", id);
    if (error) throw error;
  },
  // Al renombrar o borrar una subcategoría, sus tipos la siguen.
  // No cortan la operación principal (renombrar/borrar la subcategoría) si
  // la tabla todavía no existe: solo se avisa en la consola.
  async renombrarSubcategoria(categoria_slug: string, anterior: string, nueva: string) {
    const { error } = await supabase.from("tipos_producto").update({ subcategoria: nueva }).eq("categoria_slug", categoria_slug).eq("subcategoria", anterior);
    if (error) console.warn("tipos_producto: no se pudo actualizar la subcategoría", error.message);
  },
  async borrarDeSubcategoria(categoria_slug: string, subcategoria: string) {
    const { error } = await supabase.from("tipos_producto").delete().eq("categoria_slug", categoria_slug).eq("subcategoria", subcategoria);
    if (error) console.warn("tipos_producto: no se pudieron borrar los tipos", error.message);
  },
};

export const productosAdmin = {
  async listar(): Promise<ProductoAdmin[]> {
    const { data, error } = await supabase.from("productos").select("*").order("creado_en", { ascending: false });
    if (error) throw error;
    return data;
  },
  async crear(producto: ProductoAdmin) {
    const { error } = await supabase.from("productos").insert(producto);
    if (error) throw error;
  },
  async actualizar(sku: string, cambios: Partial<ProductoAdmin>) {
    const { error } = await supabase.from("productos").update(cambios).eq("sku", sku);
    if (error) throw error;
  },
  async borrar(sku: string) {
    const { error } = await supabase.from("productos").delete().eq("sku", sku);
    if (error) throw error;
  },
};

export const carruselAdmin = {
  async listar(): Promise<CarouselSlideAdmin[]> {
    const { data, error } = await supabase.from("carousel_slides").select("*").order("orden");
    if (error) throw error;
    return data;
  },
  async crear(slide: Omit<CarouselSlideAdmin, "id">) {
    const { error } = await supabase.from("carousel_slides").insert(slide);
    if (error) throw error;
  },
  async actualizar(id: string, cambios: Partial<CarouselSlideAdmin>) {
    const { error } = await supabase.from("carousel_slides").update(cambios).eq("id", id);
    if (error) throw error;
  },
  async borrar(id: string) {
    const { error } = await supabase.from("carousel_slides").delete().eq("id", id);
    if (error) throw error;
  },
};

export interface CatalogoAdmin {
  id: string;
  nombre: string;
  descripcion: string;
  archivo_url: string;
  portada_url: string | null;
  orden: number;
}

export const catalogosAdmin = {
  async listar(): Promise<CatalogoAdmin[]> {
    const { data, error } = await supabase.from("catalogos").select("*").order("orden");
    if (error) throw error;
    return data;
  },
  async crear(catalogo: Omit<CatalogoAdmin, "id">) {
    const { error } = await supabase.from("catalogos").insert(catalogo);
    if (error) throw error;
  },
  async actualizar(id: string, cambios: Partial<CatalogoAdmin>) {
    const { error } = await supabase.from("catalogos").update(cambios).eq("id", id);
    if (error) throw error;
  },
  async borrar(id: string) {
    const { error } = await supabase.from("catalogos").delete().eq("id", id);
    if (error) throw error;
  },
};

export interface ConfiguracionSitio {
  id: number;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  horario: string | null;
  whatsapp_numero: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  logo_url: string | null;
  foto_fachada_url: string | null;
  mision: string | null;
  vision: string | null;
  historia: string | null;
  valores: { titulo: string; desc: string; imagen?: string | null }[] | null;
  medios_pago: string[] | null;
  atencion_mayorista_texto: string | null;
  atencion_tienda_youtube: string | null;
  atencion_mayorista_youtube: string | null;
}

export const configuracionAdmin = {
  async obtener(): Promise<ConfiguracionSitio | null> {
    const { data, error } = await supabase.from("configuracion_sitio").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
  async actualizar(cambios: Partial<ConfiguracionSitio>) {
    const { error } = await supabase.from("configuracion_sitio").update(cambios).eq("id", 1);
    if (error) throw error;
  },
};

export const adminsGestion = {
  async listar(): Promise<AdminUsuario[]> {
    const { data, error } = await supabase.from("admins").select("*").order("creado_en");
    if (error) throw error;
    return data;
  },
  // Agrega un correo a la lista de admins — no hace falta que esa persona
  // ya haya iniciado sesión antes: en cuanto entre con Google usando este
  // mismo correo, va a tener acceso automáticamente.
  async agregar(email: string) {
    const { error } = await supabase.from("admins").insert({ email: email.trim().toLowerCase() });
    if (error) throw error;
  },
  async quitar(id: string) {
    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) throw error;
  },
};
