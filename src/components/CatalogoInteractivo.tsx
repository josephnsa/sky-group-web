import { useEffect, useMemo, useState } from "preact/hooks";
import { motion } from "framer-motion";
import type { Producto } from "../data/catalog";
import { IconChevronDown } from "./icons/ui";
import { DURATION } from "../lib/motion";
import ProductGrid from "./ProductGrid";

interface Props {
  productos: Producto[];
  // Si se pasa, se muestra el selector de categoría (uso: /catalogo).
  // Si se omite, el listado ya viene fijo a una categoría (uso: /catalogo/[categoria]).
  categorias?: string[];
}

type Orden = "relevancia" | "precio-asc" | "precio-desc" | "nombre-asc";

const POR_PAGINA = 12;

// El sitio es 100% estático (sin servidor por request), así que no existe un
// "Astro.url" con query string en tiempo de build — el parámetro ?q= del
// buscador del Header (un <form> normal, sin JS, que apunta a
// /catalogo?q=...) solo se puede leer del lado del cliente.
function busquedaDesdeUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export default function CatalogoInteractivo({ productos, categorias }: Props) {
  const [busqueda, setBusqueda] = useState("");

  // El estado inicial de un input controlado no siempre "prende" durante la
  // hidratación (el HTML del servidor ya trae value="", y Preact puede no
  // forzar la actualización del DOM real si asume que ya coincide) — bug
  // real encontrado y verificado con Playwright: el valor calculado era
  // correcto en el primer render, pero nunca llegaba al <input>. Un
  // useEffect que corre después del montaje sí dispara una re-renderización
  // normal (no hidratación), que si actualiza el DOM de forma confiable.
  useEffect(() => {
    const q = busquedaDesdeUrl();
    if (q) setBusqueda(q);
  }, []);
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [marcas, setMarcas] = useState<string[]>([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [pagina, setPagina] = useState(1);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Universo base tras aplicar categoría/subcategoría, para calcular qué marcas
  // mostrar como opción (evita listar marcas que no tienen sentido en el filtro actual).
  const universoCategoria = useMemo(() => {
    return productos.filter((p) => {
      const okCategoria = !categoria || p.categoria === categoria;
      return okCategoria;
    });
  }, [productos, categoria]);

  const subcategoriasDisponibles = useMemo(() => {
    return Array.from(new Set(universoCategoria.map((p) => p.subcategoria))).sort();
  }, [universoCategoria]);

  const marcasDisponibles = useMemo(() => {
    return Array.from(new Set(universoCategoria.map((p) => p.marca))).sort();
  }, [universoCategoria]);

  function toggleMarca(m: string) {
    setPagina(1);
    setMarcas((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoria("");
    setSubcategoria("");
    setMarcas([]);
    setPrecioMin("");
    setPrecioMax("");
    setSoloOfertas(false);
    setOrden("relevancia");
    setPagina(1);
  }

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const min = precioMin ? Number(precioMin) : null;
    const max = precioMax ? Number(precioMax) : null;

    let lista = productos.filter((p) => {
      const coincideTexto =
        !texto ||
        p.nombre.toLowerCase().includes(texto) ||
        p.marca.toLowerCase().includes(texto) ||
        p.sku.toLowerCase().includes(texto);
      const coincideCategoria = !categoria || p.categoria === categoria;
      const coincideSubcategoria = !subcategoria || p.subcategoria === subcategoria;
      const coincideMarca = marcas.length === 0 || marcas.includes(p.marca);
      const coincideMin = min === null || p.precio >= min;
      const coincideMax = max === null || p.precio <= max;
      const coincideOferta = !soloOfertas || (p.precioAnterior && p.precioAnterior > p.precio);
      return (
        coincideTexto &&
        coincideCategoria &&
        coincideSubcategoria &&
        coincideMarca &&
        coincideMin &&
        coincideMax &&
        coincideOferta
      );
    });

    lista = [...lista].sort((a, b) => {
      if (orden === "precio-asc") return a.precio - b.precio;
      if (orden === "precio-desc") return b.precio - a.precio;
      if (orden === "nombre-asc") return a.nombre.localeCompare(b.nombre);
      return 0;
    });

    return lista;
  }, [busqueda, categoria, subcategoria, marcas, precioMin, precioMax, soloOfertas, orden, productos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const hayFiltrosActivos =
    busqueda || categoria || subcategoria || marcas.length > 0 || precioMin || precioMax || soloOfertas;

  return (
    <div class="flex flex-col gap-6 lg:flex-row">
      {/* Botón para mostrar/ocultar filtros en móvil */}
      <button
        type="button"
        onClick={() => setFiltrosAbiertos((v) => !v)}
        class="flex items-center justify-between rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors duration-200 lg:hidden dark:border-neutral-700 dark:text-neutral-200"
      >
        <span>
          Filtros {hayFiltrosActivos && <span class="ml-1 text-brand-blue">●</span>}
        </span>
        <IconChevronDown class={`h-4 w-4 transition-transform duration-200 ${filtrosAbiertos ? "rotate-180" : ""}`} />
      </button>

      <motion.div
        initial={false}
        animate={{ height: filtrosAbiertos ? "auto" : 0, opacity: filtrosAbiertos ? 1 : 0 }}
        transition={{ duration: DURATION.base }}
        class="w-full flex-none overflow-hidden lg:!h-auto lg:w-64 lg:!opacity-100 lg:overflow-visible"
      >
      <aside class="space-y-5 pb-1">
        <div>
          <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Buscar</label>
          <input
            type="search"
            placeholder="Nombre, marca o código..."
            value={busqueda}
            onInput={(e) => {
              setPagina(1);
              setBusqueda((e.target as HTMLInputElement).value);
            }}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        {categorias && (
          <div>
            <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => {
                setPagina(1);
                setSubcategoria("");
                setCategoria((e.target as HTMLSelectElement).value);
              }}
              class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {subcategoriasDisponibles.length > 0 && (
          <div>
            <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Subcategoría</label>
            <select
              value={subcategoria}
              onChange={(e) => {
                setPagina(1);
                setSubcategoria((e.target as HTMLSelectElement).value);
              }}
              class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Todas</option>
              {subcategoriasDisponibles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Precio (S/)</label>
          <div class="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Mín."
              value={precioMin}
              onInput={(e) => {
                setPagina(1);
                setPrecioMin((e.target as HTMLInputElement).value);
              }}
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <span class="text-neutral-400 dark:text-neutral-500">-</span>
            <input
              type="number"
              min={0}
              placeholder="Máx."
              value={precioMax}
              onInput={(e) => {
                setPagina(1);
                setPrecioMax((e.target as HTMLInputElement).value);
              }}
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {marcasDisponibles.length > 0 && (
          <div>
            <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Marca</label>
            <div class="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
              {marcasDisponibles.map((m) => (
                <label key={m} class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={marcas.includes(m)}
                    onChange={() => toggleMarca(m)}
                    class="accent-brand-blue"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
        )}

        <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={soloOfertas}
            onChange={(e) => {
              setPagina(1);
              setSoloOfertas((e.target as HTMLInputElement).checked);
            }}
            class="accent-brand-blue"
          />
          Solo ofertas
        </label>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            class="text-sm font-medium text-brand-blue-dark hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </aside>
      </motion.div>

      <div class="min-w-0 flex-1 space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {filtrados.length} producto{filtrados.length !== 1 ? "s" : ""} encontrado
            {filtrados.length !== 1 ? "s" : ""}
          </p>
          <select
            value={orden}
            onChange={(e) => setOrden((e.target as HTMLSelectElement).value as Orden)}
            class="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            aria-label="Ordenar por"
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre-asc">Nombre: A-Z</option>
          </select>
        </div>

        <ProductGrid productos={paginados} />

        {totalPaginas > 1 && (
          <div class="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              disabled={paginaActual <= 1}
              onClick={() => setPagina(paginaActual - 1)}
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200"
            >
              Anterior
            </button>
            <span class="text-sm text-neutral-600 dark:text-neutral-400">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina(paginaActual + 1)}
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
