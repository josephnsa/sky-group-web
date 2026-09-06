import { useStore } from "@nanostores/preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { cartCount } from "../lib/cart-store";
import { IconCart } from "./icons/ui";

// CSS puro (sin framer-motion): este componente vive en el Header, presente
// en TODAS las páginas — cargar framer-motion + el shim de preact/compat acá
// le sumaría ~130KB a cada página del sitio solo por un efecto cosmético del
// badge, cuando la mayoría de páginas (Nosotros, Contacto, etc.) no
// necesitan framer-motion para nada más. Se reserva esa dependencia para las
// páginas que sí lo aprovechan de verdad (catálogo, producto, carrito).
export default function CartIcon() {
  const count = useStore(cartCount);
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      setPop(true);
      const t = setTimeout(() => setPop(false), 350);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <a
      href="/carrito"
      class="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white"
      aria-label={`Carrito de compras, ${count} productos`}
    >
      <IconCart class="h-6 w-6" />
      <span class="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span
          class={`absolute -top-1 -right-1 sm:static sm:-translate-y-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white ${pop ? "animate-pop" : ""}`}
        >
          {count}
        </span>
      )}
    </a>
  );
}
