// Calcula una huella (SHA-256) de los datos de Supabase con los que se arma la web.
// El flujo de publicación la compara con la de la web publicada: si cambió algo
// en el panel de administración, vuelve a publicar el sitio.
import { createHash } from "node:crypto";

const URL_BASE = process.env.PUBLIC_SUPABASE_URL;
const CLAVE = process.env.PUBLIC_SUPABASE_ANON_KEY;
if (!URL_BASE || !CLAVE) {
  console.error("Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const TABLAS = ["productos", "categorias", "subcategorias", "tipos_producto", "carousel_slides", "catalogos", "configuracion_sitio"];

const partes = [];
for (const tabla of TABLAS) {
  const r = await fetch(`${URL_BASE}/rest/v1/${tabla}?select=*`, { headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}` } });
  // Una tabla que todavía no existe no debe impedir publicar.
  const filas = r.ok ? await r.json() : [];
  partes.push(tabla, ...filas.map((f) => JSON.stringify(f)).sort());
}
process.stdout.write(createHash("sha256").update(partes.join("\n")).digest("hex"));
