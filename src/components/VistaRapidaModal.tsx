import { useEffect } from "preact/hooks";
import { motion } from "framer-motion";
import { getImagenProducto, type Producto } from "../data/catalog";
import { IconClose } from "./icons/ui";
import { DURATION, EASE_BRAND } from "../lib/motion";
import AddToCartButton from "./AddToCartButton";

interface Props {
  producto: Producto;
  onClose: () => void;
}

function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export default function VistaRapidaModal({ producto, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const tieneDescuento =
    producto.precio != null && producto.precioAnterior != null && producto.precioAnterior > producto.precio;

  return (
    <motion.div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista rápida: ${producto.nombre}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.base }}
    >
      <motion.div
        class="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-neutral-900"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: DURATION.base, ease: EASE_BRAND }}
      >
        <div class="flex items-start justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Vista rápida
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            class="rounded-md p-2 text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <IconClose class="h-4 w-4" />
          </button>
        </div>

        <div class="grid gap-6 p-4 sm:grid-cols-2 sm:p-6">
          <img
            src={getImagenProducto(producto)}
            alt={producto.nombre}
            class="aspect-square w-full rounded-lg bg-neutral-100 object-cover dark:bg-neutral-800"
          />

          <div class="flex flex-col">
            <p class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {producto.marca}
            </p>
            <h2 class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{producto.nombre}</h2>
            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Código: {producto.sku}</p>

            {producto.precio != null && (
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatearSoles(producto.precio)}
                </span>
                {tieneDescuento && (
                  <span class="text-sm text-neutral-400 line-through dark:text-neutral-500">
                    {formatearSoles(producto.precioAnterior!)}
                  </span>
                )}
              </div>
            )}

            <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{producto.descripcion}</p>

            {producto.compatibilidad && producto.compatibilidad.length > 0 && (
              <div class="mt-3 flex flex-wrap gap-1.5">
                {producto.compatibilidad.slice(0, 3).map((modelo) => (
                  <span
                    key={modelo}
                    class="rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    {modelo}
                  </span>
                ))}
              </div>
            )}

            <div class="mt-auto flex flex-col gap-2 pt-4">
              <AddToCartButton sku={producto.sku} />
              <a
                href={`/producto/${producto.sku}`}
                class="text-center text-sm font-medium text-brand-blue-dark hover:underline dark:text-brand-blue"
              >
                Ver ficha completa
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
