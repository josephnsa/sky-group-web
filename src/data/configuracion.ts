// Datos del footer editables desde /admin/configuracion (tabla
// `configuracion_sitio`, una sola fila). Se trae UNA vez en build-time con
// top-level `await` — mismo patrón que src/data/catalog.ts — y cada campo
// cae de vuelta a src/consts.ts si la fila todavía no existe (sitio recién
// desplegado, antes de correr la migración) o si el admin dejó un campo
// vacío, para que el footer nunca se quede roto.
import { supabase } from "../lib/supabase";
import { NEGOCIO, REDES_SOCIALES, SUCURSALES } from "../consts";

async function cargar() {
  let fila: Record<string, any> | null = null;
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
    // string vacío/null → sin editar todavía, el que consume esto (nosotros.astro)
    // se queda con su propio texto por defecto en ese caso.
    mision: (fila?.mision as string) || null,
    misionImagen: (fila?.mision_imagen as string) || null,
    vision: (fila?.vision as string) || null,
    visionImagen: (fila?.vision_imagen as string) || null,
    historia: (fila?.historia as string) || null,
    historiaImagen: (fila?.historia_imagen as string) || null,
    valores: (fila?.valores as { titulo: string; desc: string; imagen?: string | null }[] | null) || null,
    mediosPago: (fila?.medios_pago as string[] | null) || null,
  };
}

export const configuracionSitio = await cargar();
