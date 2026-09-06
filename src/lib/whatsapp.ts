import { NEGOCIO } from "../consts";
import type { CartLine } from "./cart-store";

export function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export function construirMensajePedido(lineas: CartLine[], total: number) {
  const encabezado = "Hola, quiero hacer el siguiente pedido:";
  const items = lineas
    .map(
      (l, i) =>
        `${i + 1}. ${l.producto.nombre} (${l.producto.marca}) - ` +
        `Cant: ${l.cantidad} x ${formatearSoles(l.producto.precio)} = ${formatearSoles(l.subtotal)}`,
    )
    .join("\n");
  const pie = `\n\nTotal estimado: ${formatearSoles(total)}\n\n(Precios sujetos a confirmación de stock)`;
  return `${encabezado}\n\n${items}${pie}`;
}

export function construirEnlaceWhatsApp(lineas: CartLine[], total: number) {
  const mensaje = construirMensajePedido(lineas, total);
  const numero = NEGOCIO.whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
