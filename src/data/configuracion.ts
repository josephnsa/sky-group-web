// Datos del footer editables desde /admin/configuracion (tabla
// `configuracion_sitio`, una sola fila). Se trae UNA vez en build-time con
// top-level `await` — mismo patrón que src/data/catalog.ts — y cada campo
// cae de vuelta a src/consts.ts si la fila todavía no existe (sitio recién
// desplegado, antes de correr la migración) o si el admin dejó un campo
// vacío, para que el footer nunca se quede roto.
import { supabase } from "../lib/supabase";
import { NEGOCIO, REDES_SOCIALES, SUCURSALES } from "../consts";

// Número de WhatsApp listo para wa.me: solo dígitos y con el código de Perú.
// Si el admin escribe "950 486 811" (sin 51) se completa solo; si el campo
// queda vacío o no parece un número válido, se usa el de consts.ts.
function normalizarWhatsapp(valor: unknown) {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (digitos.length === 9) return `51${digitos}`;
  if (digitos.length >= 10 && digitos.length <= 15) return digitos;
  return NEGOCIO.whatsappNumero;
}

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
    whatsappNumero: normalizarWhatsapp(fila?.whatsapp_numero),
    facebook: fila?.facebook ?? REDES_SOCIALES.facebook,
    instagram: fila?.instagram ?? REDES_SOCIALES.instagram,
    tiktok: fila?.tiktok ?? REDES_SOCIALES.tiktok,
    youtube: fila?.youtube ?? REDES_SOCIALES.youtube,
    logoUrl: fila?.logo_url || "/images/brand/logo-blanco.png",
    fotoFachadaUrl: fila?.foto_fachada_url || "/images/nosotros/fachada.webp",
    // string vacío/null → sin editar todavía, el que consume esto (nosotros.astro)
    // se queda con su propio texto por defecto en ese caso.
    mision: (fila?.mision as string) || null,
    vision: (fila?.vision as string) || null,
    historia: (fila?.historia as string) || null,
    valores: (fila?.valores as { titulo: string; desc: string; imagen?: string | null }[] | null) || null,
    mediosPago: (fila?.medios_pago as string[] | null) || null,
    atencionMayoristaTexto: (fila?.atencion_mayorista_texto as string) || null,
    atencionTiendaYoutube: (fila?.atencion_tienda_youtube as string) || null,
    atencionMayoristaYoutube: (fila?.atencion_mayorista_youtube as string) || null,
  };
}

export const configuracionSitio = await cargar();
