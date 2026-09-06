import { supabase } from "./supabase";
import { cartMap } from "./cart-store";

// Sincroniza el carrito (ya persistido en localStorage vía @nanostores/persistent)
// con una fila por usuario en Supabase, para que sobreviva a un cambio de
// navegador/celular mientras el cliente esté logueado. Se activa una sola vez
// (guardia `inicializado`) porque AuthButton es client:only y puede volver a
// montarse en cada transición de página de Astro — sin la guardia se
// acumularía un listener nuevo por navegación.
let inicializado = false;
let usuarioActual: string | null = null;
let escribiendoDesdeFusion = false;

export function iniciarSincronizacionCarrito() {
  if (inicializado) return;
  inicializado = true;

  supabase.auth.onAuthStateChange((_evento, session) => {
    const userId = session?.user?.id ?? null;
    if (userId && userId !== usuarioActual) {
      usuarioActual = userId;
      fusionarConRemoto(userId);
    } else if (!userId) {
      usuarioActual = null;
    }
  });

  cartMap.listen((valor) => {
    // Evita que el propio cambio hecho por fusionarConRemoto dispare una
    // escritura de vuelta a Supabase con el mismo dato que se acaba de leer.
    if (escribiendoDesdeFusion || !usuarioActual) return;
    guardarEnRemoto(usuarioActual, valor);
  });
}

async function fusionarConRemoto(userId: string) {
  const { data } = await supabase
    .from("carritos")
    .select("items")
    .eq("user_id", userId)
    .maybeSingle();

  const remoto = (data?.items as Record<string, number>) ?? {};
  const local = cartMap.get();

  // Fusión por máximo (no suma): así fusionar dos veces el mismo estado no
  // duplica cantidades si el usuario cierra y abre sesión varias veces sin
  // cambiar nada en el medio.
  const fusionado: Record<string, string> = { ...local };
  for (const [sku, cantidadRemota] of Object.entries(remoto)) {
    const cantidadLocal = Number(local[sku] ?? 0);
    fusionado[sku] = String(Math.max(cantidadLocal, Number(cantidadRemota)));
  }

  escribiendoDesdeFusion = true;
  cartMap.set(fusionado);
  escribiendoDesdeFusion = false;

  await guardarEnRemoto(userId, fusionado);
}

async function guardarEnRemoto(userId: string, valor: Record<string, string>) {
  const items: Record<string, number> = {};
  for (const [sku, cantidad] of Object.entries(valor)) items[sku] = Number(cantidad);
  await supabase.from("carritos").upsert({ user_id: userId, items });
}
