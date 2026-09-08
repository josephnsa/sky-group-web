import { useStore } from "@nanostores/preact";
import { useState } from "preact/hooks";
import { AnimatePresence, motion } from "framer-motion";
import {
  cartLines,
  cartTotal,
  clearCart,
  removeFromCart,
  setQuantity,
} from "../lib/cart-store";
import { construirEnlaceWhatsApp, formatearSoles } from "../lib/whatsapp";
import { getImagenProducto } from "../data/catalog";

export default function CartView() {
  const lineas = useStore(cartLines);
  const total = useStore(cartTotal);
  // Tras enviar el pedido por WhatsApp (que abre en pestaña nueva, sin
  // recargar esta página) se pregunta si vaciar el carrito o mantenerlo por
  // si el cliente quiere revisarlo de nuevo antes de que le confirmen stock.
  const [preguntarVaciar, setPreguntarVaciar] = useState(false);

  if (lineas.length === 0) {
    return (
      <div class="rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
        <p class="text-neutral-600 dark:text-neutral-400">Tu carrito está vacío.</p>
        <a
          href="/catalogo"
          class="mt-4 inline-block rounded-md bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
        >
          Ver catálogo
        </a>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <ul class="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        <AnimatePresence>
        {lineas.map((l) => (
          <motion.li
            key={l.producto.sku}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            class="flex items-center gap-4 p-4"
          >
            <img
              src={getImagenProducto(l.producto)}
              alt={l.producto.nombre}
              class="h-16 w-16 flex-none rounded-md object-cover"
              loading="lazy"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">
                {l.producto.nombre}
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{l.producto.marca}</p>
              <p class="text-sm text-neutral-700 dark:text-neutral-300">
                {formatearSoles(l.producto.precio)} c/u
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={l.cantidad}
                onInput={(e) =>
                  setQuantity(
                    l.producto.sku,
                    Number((e.target as HTMLInputElement).value),
                  )
                }
                class="w-16 rounded-md border border-neutral-300 bg-white px-2 py-1 text-center dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                aria-label={`Cantidad de ${l.producto.nombre}`}
              />
              <button
                type="button"
                onClick={() => removeFromCart(l.producto.sku)}
                class="text-sm text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                aria-label={`Quitar ${l.producto.nombre} del carrito`}
              >
                Quitar
              </button>
            </div>
            <p class="w-24 flex-none text-right font-semibold text-neutral-900 dark:text-neutral-100">
              {formatearSoles(l.subtotal)}
            </p>
          </motion.li>
        ))}
        </AnimatePresence>
      </ul>

      <div class="flex flex-col items-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <p class="text-lg font-bold text-neutral-900 dark:text-white">
          Total: <span>{formatearSoles(total)}</span>
        </p>
        <a
          href={construirEnlaceWhatsApp(lineas, total)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setPreguntarVaciar(true)}
          class="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-brand-green transition-colors duration-200 hover:bg-green-700"
        >
          Enviar pedido por WhatsApp
        </a>
        <p class="max-w-sm text-right text-xs text-neutral-500 dark:text-neutral-400">
          Al enviar el pedido se abrirá WhatsApp con el detalle de tu compra. La
          confirmación de stock y el pago se coordinan directamente con nuestro equipo.
        </p>
      </div>

      <AnimatePresence>
        {preguntarVaciar && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            class="rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-4 dark:border-brand-blue/40 dark:bg-brand-blue/10"
          >
            <p class="text-sm font-medium text-neutral-900 dark:text-white">
              ¿Ya enviaste tu pedido? ¿Quieres vaciar el carrito o mantenerlo para revisarlo después?
            </p>
            <div class="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setPreguntarVaciar(false);
                }}
                class="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
              >
                Vaciar carrito
              </button>
              <button
                type="button"
                onClick={() => setPreguntarVaciar(false)}
                class="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Mantener
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
