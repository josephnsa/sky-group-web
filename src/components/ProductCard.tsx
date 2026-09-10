import { useEffect, useRef, useState } from "preact/hooks";
import { getImagenProducto, type Producto } from "../data/catalog";
import { IconSearch } from "./icons/ui";
import AddToCartButton from "./AddToCartButton";

interface Props {
  producto: Producto;
  onVistaRapida?: (producto: Producto) => void;
}

function formatearSoles(monto: number) {
  return `S/ ${monto.toFixed(2)}`;
}

export default function ProductCard({ producto, onVistaRapida }: Props) {
  const [cargada, setCargada] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // El HTML ya viene del servidor con el <img src="..."> puesto, así que el
  // navegador puede terminar de cargarla antes de que Preact hidrate y
  // enganche onLoad — sin este chequeo, esas imágenes quedarían invisibles.
  useEffect(() => {
    if (imgRef.current?.complete) setCargada(true);
  }, []);
  const tieneDescuento =
    producto.precio != null && producto.precioAnterior != null && producto.precioAnterior > producto.precio;
  const porcentajeDescuento = tieneDescuento
    ? Math.round(
        ((producto.precioAnterior! - producto.precio!) /
          producto.precioAnterior!) *
          100,
      )
    : 0;

  return (
    <div class="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-brand dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none">
      <div class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <a
          href={`/producto/${producto.sku}`}
          class={`block h-full w-full ${cargada ? "" : "animate-pulse"}`}
        >
          <img
            ref={imgRef}
            src={getImagenProducto(producto)}
            alt={producto.nombre}
            onLoad={() => setCargada(true)}
            class={`h-full w-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-110 ${
              cargada ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            loading="lazy"
          />
        </a>
        {tieneDescuento && (
          <span class="pointer-events-none absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
            -{porcentajeDescuento}%
          </span>
        )}
        {onVistaRapida && (
          // Siempre visible (no depende de :hover) — en touch no hay hover,
          // así que un botón que solo aparece al pasar el mouse queda
          // inalcanzable en celular, que es la mayoría del tráfico de este
          // sitio (bug real encontrado al probar en un viewport táctil).
          <button
            type="button"
            onClick={() => onVistaRapida(producto)}
            aria-label="Vista rápida"
            title="Vista rápida"
            class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition-transform duration-200 hover:scale-110 active:scale-95 dark:bg-neutral-900/90 dark:text-neutral-200"
          >
            <IconSearch class="h-4 w-4" />
          </button>
        )}
      </div>
      <div class="flex flex-1 flex-col gap-1 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-blue-dark dark:text-brand-blue">
          {producto.marca}
        </p>
        <a
          href={`/producto/${producto.sku}`}
          class="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
        >
          {producto.nombre}
        </a>
        {producto.precio != null && (
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-bold text-neutral-900 dark:text-white">
              {formatearSoles(producto.precio)}
            </span>
            {tieneDescuento && (
              <span class="text-sm text-neutral-400 line-through dark:text-neutral-500">
                {formatearSoles(producto.precioAnterior!)}
              </span>
            )}
          </div>
        )}
        <div class="mt-auto pt-2">
          <AddToCartButton sku={producto.sku} />
        </div>
      </div>
    </div>
  );
}
