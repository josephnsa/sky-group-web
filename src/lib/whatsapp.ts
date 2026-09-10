import { NEGOCIO } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = "Hola, quiero hacer el siguiente pedido:";
  const items = lineas
    .map((l, i) => {
      // Muchos productos del catálogo todavía no tienen precio cargado (se
      // cotizan por WhatsApp) — se marcan así en vez de mostrar "x S/0.00 =
      // S/0.00", que daría la idea equivocada de que el producto es gratis.
      if (l.producto.precio == null) {
        return `${i + 1}. ${l.producto.nombre} (${l.producto.marca}) - Cant: ${l.cantidad} (precio a confirmar)`;
      }
      return (
        `${i + 1}. ${l.producto.nombre} (${l.producto.marca}) - ` +
        `Cant: ${l.cantidad} x ${formatearSoles(l.producto.precio)} = ${formatearSoles(l.subtotal)}`
      );
    })
    .join("\n");

  const hayConPrecio = lineas.some((l) => l.producto.precio != null);
  const hayConfirmar = lineas.some((l) => l.producto.precio == null);
  let pie: string;
  if (!hayConPrecio) {
    // Ningún producto tiene precio todavía: no se muestra ningún monto
    // (ni siquiera "S/0.00", que se leería como "gratis").
    pie = `\n\n(Todos los productos están sujetos a cotización — te confirmamos precio y stock por este mismo chat)`;
  } else if (hayConfirmar) {
    pie =
      `\n\nTotal de productos con precio: ${formatearSoles(total)}\n` +
      `(el resto está sujeto a cotización — te confirmamos precio y stock por este mismo chat)`;
  } else {
    pie = `\n\nTotal estimado: ${formatearSoles(total)}\n\n(Precios sujetos a confirmación de stock)`;
  }
  return `${encabezado}\n\n${items}${pie}`;
}

export function construirEnlaceWhatsApp(lineas: CartLine[], total: number) {
  const mensaje = construirMensajePedido(lineas, total);
  const numero = NEGOCIO.whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
