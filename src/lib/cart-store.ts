import { persistentMap } from "@nanostores/persistent";
import { computed } from "nanostores";
import { productos, type Producto } from "../data/catalog";

export interface CartItem {
  sku: string;
  cantidad: number;
}

// Se guarda como { [sku]: "cantidad" } — persistentMap solo admite valores string.
export const cartMap = persistentMap<Record<string, string>>(
  "carrito:",
  {},
);

export function addToCart(sku: string, cantidad = 1) {
  const actual = Number(cartMap.get()[sku] ?? 0);
  cartMap.setKey(sku, String(actual + cantidad));
}

export function setQuantity(sku: string, cantidad: number) {
  if (cantidad <= 0) {
    removeFromCart(sku);
    return;
  }
  cartMap.setKey(sku, String(cantidad));
}

export function removeFromCart(sku: string) {
  const actual = { ...cartMap.get() };
  delete actual[sku];
  cartMap.set(actual);
}

export function clearCart() {
  cartMap.set({});
}

export interface CartLine {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export const cartLines = computed(cartMap, (map): CartLine[] => {
  const lineas: CartLine[] = [];
  for (const [sku, cantidadStr] of Object.entries(map)) {
    const producto = productos.find((p) => p.sku === sku);
    const cantidad = Number(cantidadStr);
    if (!producto || cantidad <= 0) continue;
    lineas.push({ producto, cantidad, subtotal: (producto.precio ?? 0) * cantidad });
  }
  return lineas;
});

export const cartCount = computed(cartLines, (lineas) =>
  lineas.reduce((total, l) => total + l.cantidad, 0),
);

export const cartTotal = computed(cartLines, (lineas) =>
  lineas.reduce((total, l) => total + l.subtotal, 0),
);
