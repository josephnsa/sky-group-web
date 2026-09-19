import { useEffect, useRef, useState } from "preact/hooks";
import { productos, getImagenProducto } from "../data/catalog";
import { coincideProducto } from "../lib/busqueda";
import { IconSearch } from "./icons/ui";

const MAX_SUGERENCIAS = 6;

export default function BuscadorConSugerencias() {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  const resultados =
    texto.trim().length >= 2 ? productos.filter((p) => coincideProducto(p, texto)).slice(0, MAX_SUGERENCIAS) : [];

  useEffect(() => {
    function alHacerClicAfuera(e: MouseEvent) {
      if (raizRef.current && !raizRef.current.contains(e.target as Node)) setAbierto(false);
    }
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("click", alHacerClicAfuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("click", alHacerClicAfuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, []);

  return (
    <div ref={raizRef} class="relative hidden flex-1 max-w-md sm:block">
      <form action="/catalogo" method="GET" role="search" class="flex items-center overflow-hidden rounded-md bg-white shadow-sm transition-shadow duration-200 focus-within:ring-2 focus-within:ring-white/70">
        <input
          type="search"
          name="q"
          value={texto}
          onInput={(e) => {
            setTexto((e.target as HTMLInputElement).value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          autocomplete="off"
          class="w-full bg-transparent px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          class="flex shrink-0 items-center justify-center self-stretch bg-brand-blue-dark px-3.5 text-white transition-colors duration-200 hover:bg-brand-green-dark"
        >
          <IconSearch class="h-4 w-4" />
        </button>
      </form>

      {abierto && resultados.length > 0 && (
        <div class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <ul>
            {resultados.map((p) => (
              <li key={p.sku}>
                <a
                  href={`/producto/${p.sku}`}
                  class="flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <img src={getImagenProducto(p)} alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
                  <span class="min-w-0">
                    <span class="block truncate font-medium text-neutral-900 dark:text-neutral-100">{p.nombre}</span>
                    <span class="block truncate text-xs text-neutral-500 dark:text-neutral-400">{p.categoria}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`/catalogo?q=${encodeURIComponent(texto)}`}
            class="block border-t border-neutral-200 px-3 py-2 text-center text-sm font-medium text-brand-blue-dark transition-colors duration-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Ver todos los resultados
          </a>
        </div>
      )}
    </div>
  );
}
