// Datos del footer editables desde /admin/configuracion (tabla
// `configuracion_sitio`, una sola fila). Se trae UNA vez en build-time con
// top-level `await` — mismo patrón que src/data/catalog.ts — y cada campo
// cae de vuelta a src/consts.ts si la fila todavía no existe (sitio recién
// desplegado, antes de correr la migración) o si el admin dejó un campo
// vacío, para que el footer nunca se quede roto.
import { supabase } from "../lib/supabase";
import { NEGOCIO, REDES_SOCIALES, SUCURSALES } from "../consts";

async function cargar() {
  let fila: Record<string, string | null> | null = null;
  try {
    const { data, error } = await supabase.from("configuracion_sitio").select("*").eq("id", 1).maybeSingle();
    if (!error) fila = data;
  } catch {
    // Tabla todavía no migrada u otro problema de red — se sigue con los
    // valores de consts.ts, igual que si la fila simplemente no existiera.
  }

  return {
    telefono: fila?.telefono || NEGOCIO.telefono,
    correo: fila?.correo || NEGOCIO.correo,
    direccion: fila?.direccion || SUCURSALES[0].direccion,
    horario: fila?.horario || SUCURSALES[0].horario,
    whatsappNumero: fila?.whatsapp_numero || NEGOCIO.whatsappNumero,
    facebook: fila?.facebook ?? REDES_SOCIALES.facebook,
    instagram: fila?.instagram ?? REDES_SOCIALES.instagram,
    tiktok: fila?.tiktok ?? REDES_SOCIALES.tiktok,
    youtube: fila?.youtube ?? REDES_SOCIALES.youtube,
    logoUrl: fila?.logo_url || "/images/brand/logo-blanco.png",
    fotoFachadaUrl: fila?.foto_fachada_url || "/images/nosotros/fachada.webp",
  };
}

export const configuracionSitio = await cargar();
