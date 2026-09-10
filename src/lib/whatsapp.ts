import { NEGOCIO, SITE } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

// Salto de línea real para el mensaje de WhatsApp. \r\n (CRLF), no solo
// \n — un chat real mostró que un \n simple llega bien vía WhatsApp Web
// pero se pierde (se convierte en espacio) al abrir el enlace wa.me desde
// la app de escritorio de Windows; CRLF es el formato que ese cliente sí
// respeta de forma consistente.
const SALTO = "\r\n";

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = `Hola ${SITE.nombre}, quiero hacer el siguiente pedido:`;
  const items = lineas
    .map((l) => {
      const datos =
        l.producto.precio != null
          ? `Cant: ${l.cantidad} · Precio: ${formatearSoles(l.producto.precio)} · Subtotal: ${formatearSoles(l.subtotal)}`
          : `Cant: ${l.cantidad} · Precio: por confirmar`;
      return `• *${l.producto.nombre}* (Código: ${l.producto.sku}, ${l.producto.marca}) — ${datos}`;
    })
    .join(SALTO);

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
      `*Total de productos con precio: ${formatearSoles(total)}*${SALTO}` +
      `Quedo atento/a a la cotización y confirmación de stock del resto.`;
  } else {
    pie = `*Total estimado: ${formatearSoles(total)}*${SALTO}(Precios sujetos a confirmación de stock).`;
  }
  return `${encabezado}${SALTO}${SALTO}${items}${SALTO}${SALTO}${pie}`;
}

export function construirEnlaceWhatsApp(lineas: CartLine[], total: number) {
  const mensaje = construirMensajePedido(lineas, total);
  const numero = NEGOCIO.whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
