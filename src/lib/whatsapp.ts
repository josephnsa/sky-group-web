import { NEGOCIO } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = "Hola, quiero hacer el siguiente pedido:";
  // Cada producto en su propio bloque (nombre en negrita + una línea de
  // datos abajo, no todo apretado en un solo renglón largo) — más fácil de
  // leer de un vistazo para quien recibe el pedido del lado de la empresa.
  // *texto* es la negrita nativa de WhatsApp, no una convención inventada.
  const items = lineas
    .map((l, i) => {
      const precioLinea =
        l.producto.precio != null
          ? `Cant: ${l.cantidad}  ·  Precio: ${formatearSoles(l.producto.precio)}  ·  Subtotal: ${formatearSoles(l.subtotal)}`
          : `Cant: ${l.cantidad}  ·  Precio: por confirmar`;
      return `${i + 1}. *${l.producto.nombre}*\nCódigo: ${l.producto.sku}  ·  Marca: ${l.producto.marca}\n${precioLinea}`;
    })
    .join("\n\n");

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
      `*Total de productos con precio: ${formatearSoles(total)}*\n` +
      `Quedo atento/a a la cotización y confirmación de stock del resto.`;
  } else {
    pie = `*Total estimado: ${formatearSoles(total)}*\n(Precios sujetos a confirmación de stock)`;
  }
  return `${encabezado}\n\n${items}\n\n${pie}`;
}

export function construirEnlaceWhatsApp(lineas: CartLine[], total: number) {
  const mensaje = construirMensajePedido(lineas, total);
  const numero = NEGOCIO.whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
