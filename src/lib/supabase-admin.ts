import { supabase } from "./supabase";

export interface CategoriaAdmin {
  slug: string;
  nombre: string;
  foto_url: string | null;
  orden: number;
  activo: boolean;
}

export interface ProductoAdmin {
  sku: string;
  categoria_slug: string;
  subcategoria: string;
  nombre: string;
  marca: string;
  precio: number;
  precio_anterior: number | null;
  imagen: string | null;
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
