import { NEGOCIO } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = "Hola, quiero hacer el siguiente pedido:";
  const items = lineas
    .map((l, i) => {
      // Código del producto siempre incluido — la empresa lo necesita para
      // ubicarlo en su propio inventario, el nombre solo no alcanza.
      // Muchos productos del catálogo todavía no tienen precio cargado (se
      // cotizan por WhatsApp) — se marcan así en vez de mostrar "x S/0.00 =
      // S/0.00", que daría la idea equivocada de que el producto es gratis.
      if (l.producto.precio == null) {
        return `${i + 1}. ${l.producto.nombre} (${l.producto.marca}) - Código: ${l.producto.sku} - Cant: ${l.cantidad} (precio a confirmar)`;
      }
      return (
        `${i + 1}. ${l.producto.nombre} (${l.producto.marca}) - Código: ${l.producto.sku} - ` +
        `Cant: ${l.cantidad} x ${formatearSoles(l.producto.precio)} = ${formatearSoles(l.subtotal)}`
      );
    })
    .join("\n");

  // El mensaje lo escribe el cliente hacia la empresa — el texto tiene que
  // sonar como algo que el cliente diría ("quedo atento/a"), no como si la
  // empresa le estuviera respondiendo a sí misma ("te confirmamos").
  const hayConPrecio = lineas.some((l) => l.producto.precio != null);
  const hayConfirmar = lineas.some((l) => l.producto.precio == null);
  let pie: string;
  if (!hayConPrecio) {
    // Ningún producto tiene precio todavía: no se muestra ningún monto
    // (ni siquiera "S/0.00", que se leería como "gratis").
    pie = `\n\nQuedo atento/a a la cotización y confirmación de stock de estos productos.`;
  } else if (hayConfirmar) {
    pie =
      `\n\nTotal de productos con precio: ${formatearSoles(total)}\n` +
      `Quedo atento/a a la cotización y confirmación de stock del resto.`;
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
