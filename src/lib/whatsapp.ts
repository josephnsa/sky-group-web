import { NEGOCIO } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = "Hola, quiero hacer el siguiente pedido:";
  // Todo el mensaje se manda sin depender de saltos de línea — verificado
  // en un chat real que WhatsApp (al menos vía el enlace wa.me abierto
  // desde la app de escritorio) NO los respeta: el mensaje entero llegó
  // pegado en un solo bloque, cada \n convertido en un espacio. El formato
  // anterior (3 líneas por producto) se volvía ilegible apenas eso pasaba.
  // Este formato da por hecho que va a quedar todo corrido y arma cada
  // ítem para que siga siendo legible así: un solo bloque autocontenido
  // por producto (número + nombre en negrita + el resto, cerrado con un
  // punto), para que "N. *Nombre*" siga marcando dónde empieza cada uno.
  const items = lineas
    .map((l, i) => {
      const datos =
        l.producto.precio != null
          ? `Cant: ${l.cantidad} · Precio: ${formatearSoles(l.producto.precio)} · Subtotal: ${formatearSoles(l.subtotal)}`
          : `Cant: ${l.cantidad} · Precio: por confirmar`;
      return `${i + 1}. *${l.producto.nombre}* (Código: ${l.producto.sku}, ${l.producto.marca}) — ${datos}.`;
    })
    .join(" ");

  // El mensaje lo escribe el cliente hacia la empresa — el texto tiene que
  // sonar como algo que el cliente diría ("quedo atento/a"), no como si la
  // empresa le estuviera respondiendo a sí misma ("te confirmamos").
  const hayConPrecio = lineas.some((l) => l.producto.precio != null);
  const hayConfirmar = lineas.some((l) => l.producto.precio == null);
  let pie: string;
  if (!hayConPrecio) {
    // Ningún producto tiene precio todavía: no se muestra ningún monto
    // (ni siquiera "S/0.00", que se leería como "gratis").
    pie = `Quedo atento/a a la cotización y confirmación de stock de estos productos.`;
  } else if (hayConfirmar) {
    pie =
      `*Total de productos con precio: ${formatearSoles(total)}*. ` +
      `Quedo atento/a a la cotización y confirmación de stock del resto.`;
  } else {
    pie = `*Total estimado: ${formatearSoles(total)}* (precios sujetos a confirmación de stock).`;
  }
  return `${encabezado} ${items} ${pie}`;
}

export function construirEnlaceWhatsApp(lineas: CartLine[], total: number) {
  const mensaje = construirMensajePedido(lineas, total);
  const numero = NEGOCIO.whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
