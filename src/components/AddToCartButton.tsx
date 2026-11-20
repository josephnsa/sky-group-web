import { useState } from "preact/hooks";
import { addToCart } from "../lib/cart-store";
import { IconPlus, IconMinus } from "./icons/ui";

interface Props {
  sku: string;
  /** En las tarjetas del catálogo: cantidad y botón en una sola fila. */
  compacto?: boolean;
}

export default function AddToCartButton({ sku, compacto = false }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  function handleClick() {
    addToCart(sku, cantidad);
    setAgregado(true);
    setCantidad(1);
    setTimeout(() => setAgregado(false), 1500);
  }

  const alto = compacto ? "h-8 w-6" : "h-7 w-7";

  const selector = (
    <div
      class={`flex shrink-0 items-center justify-center rounded-md ${compacto ? "gap-0.5" : "gap-1"} border border-neutral-300 dark:border-neutral-700 ${compacto ? "" : "self-start"}`}
    >
      <button
        type="button"
        aria-label="Reducir cantidad"
        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
        class={`flex ${alto} items-center justify-center text-neutral-500 transition-colors duration-200 hover:text-brand-blue-dark disabled:opacity-30 dark:text-neutral-400 dark:hover:text-brand-blue`}
        disabled={cantidad <= 1}
      >
        <IconMinus class="h-3 w-3" />
      </button>
      <span class="w-5 text-center text-xs font-semibold text-neutral-800 dark:text-neutral-100" aria-live="polite">
        {cantidad}
      </span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        onClick={() => setCantidad((c) => Math.min(99, c + 1))}
        class={`flex ${alto} items-center justify-center text-neutral-500 transition-colors duration-200 hover:text-brand-blue-dark dark:text-neutral-400 dark:hover:text-brand-blue`}
      >
        <IconPlus class="h-3 w-3" />
      </button>
    </div>
  );

  if (compacto) {
    return (
      <div class="flex flex-wrap items-center gap-2">
        {selector}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Añadir al carrito"
          class="h-8 grow basis-14 whitespace-nowrap rounded-md bg-brand-blue px-1.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark active:scale-[0.98]"
        >
          {agregado ? "✓" : "Añadir"}
        </button>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-1.5">
      {selector}
      <button
        type="button"
        onClick={handleClick}
        class="w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark active:scale-[0.98]"
      >
        {agregado ? "Añadido ✓" : "Añadir al carrito"}
      </button>
    </div>
  );
}
