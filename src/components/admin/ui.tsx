// Piezas visuales compartidas por todas las secciones del panel de administración:
// gestor de fotos con orden, selector de archivo con vista previa, paginación,
// diálogos de confirmación y avisos breves.
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

/* ============================== Gestor de fotos ============================== */

export interface FotoItem {
  id: string;
  /** URL ya publicada o vista previa local (blob:) de un archivo nuevo. */
  url: string;
  /** Presente solo en fotos nuevas que todavía hay que subir. */
  archivo?: File;
}

let contador = 0;
const nuevoId = () => `f${Date.now().toString(36)}${(contador++).toString(36)}`;

export function fotosDesdeUrls(urls: (string | null | undefined)[]): FotoItem[] {
  return urls.filter((u): u is string => Boolean(u)).map((url) => ({ id: nuevoId(), url }));
}

export function fotosDesdeArchivos(archivos: File[]): FotoItem[] {
  return archivos
    .filter((a) => a.type.startsWith("image/"))
    .map((archivo) => ({ id: nuevoId(), url: URL.createObjectURL(archivo), archivo }));
}

/** Sube las fotos nuevas y devuelve todas las URLs en el orden elegido. */
export async function urlsFinales(fotos: FotoItem[], subir: (archivo: File) => Promise<string>) {
  return Promise.all(fotos.map((f) => (f.archivo ? subir(f.archivo) : Promise.resolve(f.url))));
}

interface GestorFotosProps {
  id: string;
  fotos: FotoItem[];
  onCambiar: (fotos: FotoItem[]) => void;
}

export function GestorFotos({ id, fotos, onCambiar }: GestorFotosProps) {
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [archivosEncima, setArchivosEncima] = useState(false);

  function mover(desde: number, hasta: number) {
    if (hasta < 0 || hasta >= fotos.length || desde === hasta) return;
    const copia = [...fotos];
    const [item] = copia.splice(desde, 1);
    copia.splice(hasta, 0, item);
    onCambiar(copia);
  }

  function quitar(idFoto: string) {
    onCambiar(fotos.filter((f) => f.id !== idFoto));
  }

  function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    onCambiar([...fotos, ...fotosDesdeArchivos(Array.from(lista))]);
  }

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer?.types.includes("Files")) {
          e.preventDefault();
          setArchivosEncima(true);
        }
      }}
      onDragLeave={() => setArchivosEncima(false)}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
          agregar(e.dataTransfer.files);
        }
        setArchivosEncima(false);
      }}
      class={`rounded-lg border-2 border-dashed p-3 transition-colors ${
        archivosEncima ? "border-brand-blue bg-brand-blue/5" : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      <ul class="grid grid-cols-3 gap-2 sm:grid-cols-4" data-gestor-fotos>
        {fotos.map((f, i) => (
          <li
            key={f.id}
            data-foto={i + 1}
            draggable
            onDragStart={(e) => {
              setArrastrando(f.id);
              e.dataTransfer?.setData("text/plain", f.id);
            }}
            onDragEnd={() => {
              setArrastrando(null);
              setSobre(null);
            }}
            onDragOver={(e) => {
              if (arrastrando) {
                e.preventDefault();
                setSobre(f.id);
              }
            }}
            onDrop={(e) => {
              if (!arrastrando) return;
              e.preventDefault();
              e.stopPropagation();
              mover(fotos.findIndex((x) => x.id === arrastrando), i);
              setArrastrando(null);
              setSobre(null);
            }}
            class={`group relative aspect-square cursor-grab overflow-hidden rounded-md border bg-neutral-100 dark:bg-neutral-800 ${
              i === 0 ? "border-brand-blue ring-2 ring-brand-blue/40" : "border-neutral-200 dark:border-neutral-700"
            } ${arrastrando === f.id ? "opacity-40" : ""} ${sobre === f.id && arrastrando !== f.id ? "ring-2 ring-amber-400" : ""}`}
          >
            <img src={f.url} alt={`Foto ${i + 1}`} class="h-full w-full object-cover" draggable={false} />
            <span
              class={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ${
                i === 0 ? "bg-brand-blue" : "bg-black/60"
              }`}
            >
              {i === 0 ? "1 · Principal" : i + 1}
            </span>
            {f.archivo && (
              <span class="absolute right-1 top-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">Nueva</span>
            )}
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-1 py-0.5">
              <button
                type="button"
                aria-label={`Mover foto ${i + 1} a la izquierda`}
                disabled={i === 0}
                onClick={() => mover(i, i - 1)}
                class="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={`Quitar foto ${i + 1}`}
                onClick={() => quitar(f.id)}
                class="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-red-600"
              >
                ✕
              </button>
              <button
                type="button"
                aria-label={`Mover foto ${i + 1} a la derecha`}
                disabled={i === fotos.length - 1}
                onClick={() => mover(i, i + 1)}
                class="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </li>
        ))}
        <li class="aspect-square">
          <label
            for={id}
            class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white text-center text-xs font-semibold text-brand-blue-dark transition-colors hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-brand-blue"
          >
            <span class="text-2xl leading-none">+</span>
            Agregar fotos
          </label>
          <input
            id={id}
            type="file"
            accept="image/*"
            multiple
            class="sr-only"
            onChange={(e) => {
              agregar((e.target as HTMLInputElement).files);
              (e.target as HTMLInputElement).value = "";
            }}
          />
        </li>
      </ul>
      <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {fotos.length === 0
          ? "Todavía no hay fotos. Puedes elegir varias a la vez o arrastrarlas aquí."
          : `${fotos.length} foto${fotos.length !== 1 ? "s" : ""}. La foto 1 es la principal. Cambia el orden arrastrándolas o con las flechas ‹ ›.`}
      </p>
    </div>
  );
}

/* ======================= Selector de archivo con vista previa ======================= */

interface SelectorArchivoProps {
  id: string;
  accept: string;
  tipo: "imagen" | "video" | "pdf";
  archivo: File | null;
  onElegir: (archivo: File | null) => void;
  /** Archivo ya guardado (URL), si existe. */
  actual?: string | null;
  /** Si se pasa, aparece "Quitar" para el archivo guardado. */
  quitarActual?: boolean;
  onQuitarActual?: (quitar: boolean) => void;
  /** Solo visual: marca el campo como obligatorio. */
  requerido?: boolean;
  /** Clases para la vista previa de imágenes (alto, forma, fondo). */
  clasePrevia?: string;
}

export function SelectorArchivo({
  id,
  accept,
  tipo,
  archivo,
  onElegir,
  actual,
  quitarActual,
  onQuitarActual,
  requerido,
  clasePrevia = "h-24 w-24 object-cover",
}: SelectorArchivoProps) {
  const previaLocal = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => {
    if (previaLocal) URL.revokeObjectURL(previaLocal);
  }, [previaLocal]);
  const [encima, setEncima] = useState(false);

  const mostrado = previaLocal ?? (quitarActual ? null : actual ?? null);
  const nombre = archivo ? archivo.name : actual ? decodeURIComponent(actual.split("/").pop() ?? "") : "";
  const textoBoton = archivo || (actual && !quitarActual) ? "Cambiar" : tipo === "pdf" ? "Elegir PDF" : tipo === "video" ? "Elegir video" : "Elegir imagen";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) onElegir(f);
      }}
      class={`mt-1 flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
        encima ? "border-brand-blue bg-brand-blue/5" : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      {mostrado && tipo === "imagen" && (
        <img src={mostrado} alt="Vista previa" class={`rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 ${clasePrevia}`} />
      )}
      {mostrado && tipo === "video" && <video src={mostrado} class="h-24 rounded-md bg-black" controls muted preload="metadata" />}
      {mostrado && tipo === "pdf" && (
        <a href={mostrado} target="_blank" rel="noopener noreferrer" class="flex h-16 w-14 items-center justify-center rounded-md bg-red-600 text-xs font-bold text-white">
          PDF
        </a>
      )}
      <div class="min-w-0 flex-1">
        {mostrado ? (
          <p class="truncate text-sm text-neutral-700 dark:text-neutral-300">
            {archivo ? <span class="mr-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Nuevo</span> : null}
            {nombre}
          </p>
        ) : (
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {quitarActual ? "Se quitará al guardar." : "Ningún archivo. Elige uno o arrástralo aquí."}
          </p>
        )}
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <label
            for={id}
            class="cursor-pointer rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            {textoBoton}
          </label>
          <input
            id={id}
            type="file"
            accept={accept}
            class="sr-only"
            onChange={(e) => {
              const f = (e.target as HTMLInputElement).files?.[0] ?? null;
              if (f) {
                onElegir(f);
                onQuitarActual?.(false);
              }
              (e.target as HTMLInputElement).value = "";
            }}
          />
          {archivo && (
            <button type="button" onClick={() => onElegir(null)} class="rounded-md px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Descartar
            </button>
          )}
          {!archivo && actual && onQuitarActual && (
            <button
              type="button"
              onClick={() => onQuitarActual(!quitarActual)}
              class="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              {quitarActual ? "Deshacer" : "Quitar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================= Paginación ================================= */

export function usePaginacion<T>(items: T[], porPagina: number, reiniciarCon: unknown[] = []) {
  const [pagina, setPagina] = useState(1);
  useEffect(() => setPagina(1), reiniciarCon);
  const total = Math.max(1, Math.ceil(items.length / porPagina));
  const actual = Math.min(pagina, total);
  return {
    pagina: actual,
    setPagina,
    visibles: items.slice((actual - 1) * porPagina, actual * porPagina),
    total: items.length,
    porPagina,
  };
}

interface PaginacionProps {
  pagina: number;
  total: number;
  porPagina: number;
  setPagina: (p: number) => void;
  nombre?: string;
}

export function Paginacion({ pagina, total, porPagina, setPagina, nombre = "elementos" }: PaginacionProps) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const numeros: (number | "…")[] = [];
  for (let p = 1; p <= paginas; p++) {
    if (p === 1 || p === paginas || Math.abs(p - pagina) <= 1) numeros.push(p);
    else if (numeros[numeros.length - 1] !== "…") numeros.push("…");
  }
  const base = "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors";
  return (
    <nav aria-label={`Páginas de ${nombre}`} class="mt-3 flex flex-wrap items-center justify-between gap-2" data-paginacion>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        Mostrando {desde}–{hasta} de {total} {nombre}
      </p>
      {paginas > 1 && (
        <div class="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
            class={`${base} bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700`}
          >
            ‹
          </button>
          {numeros.map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} class="px-1 text-xs text-neutral-400">…</span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === pagina ? "page" : undefined}
                onClick={() => setPagina(n)}
                class={`${base} ${
                  n === pagina
                    ? "bg-brand-blue text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Página siguiente"
            disabled={pagina >= paginas}
            onClick={() => setPagina(pagina + 1)}
            class={`${base} bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700`}
          >
            ›
          </button>
        </div>
      )}
    </nav>
  );
}

/* ========================= Confirmación y avisos breves ========================= */

interface Confirmacion {
  titulo: string;
  mensaje: string;
  textoBoton: string;
  peligroso: boolean;
  resolver: (ok: boolean) => void;
}

/** Reemplaza confirm() del navegador por un diálogo del panel. */
export function useConfirmar() {
  const [estado, setEstado] = useState<Confirmacion | null>(null);
  function confirmar(titulo: string, mensaje: string, textoBoton = "Borrar", peligroso = true) {
    return new Promise<boolean>((resolver) => setEstado({ titulo, mensaje, textoBoton, peligroso, resolver }));
  }
  function cerrar(ok: boolean) {
    estado?.resolver(ok);
    setEstado(null);
  }
  const dialogo = estado ? (
    <Modal onCerrar={() => cerrar(false)} ancho="max-w-sm">
      <h3 class="font-semibold text-neutral-900 dark:text-white">{estado.titulo}</h3>
      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{estado.mensaje}</p>
      <div class="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => cerrar(false)} class="rounded-md px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => cerrar(true)}
          class={`rounded-md px-4 py-2 text-sm font-semibold text-white ${estado.peligroso ? "bg-red-600 hover:bg-red-700" : "bg-brand-blue hover:bg-brand-blue-dark"}`}
        >
          {estado.textoBoton}
        </button>
      </div>
    </Modal>
  ) : null;
  return { confirmar, dialogo };
}

/** Mensaje breve que aparece abajo y se va solo ("Producto guardado"). */
export function useAvisoBreve() {
  const [texto, setTexto] = useState<{ msg: string; error: boolean } | null>(null);
  const timer = useRef<number>();
  function avisar(msg: string, error = false) {
    setTexto({ msg, error });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTexto(null), error ? 6000 : 3000);
  }
  const aviso = texto ? (
    <div
      role="status"
      class={`fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
        texto.error ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {texto.error ? "⚠ " : "✓ "}
      {texto.msg}
    </div>
  ) : null;
  return { avisar, aviso };
}

/** Ventana modal con fondo oscuro; Escape o clic afuera la cierran. */
export function Modal({ children, onCerrar, ancho = "max-w-xl" }: { children: ComponentChildren; onCerrar: () => void; ancho?: string }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);
  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div class={`my-4 w-full ${ancho} rounded-xl bg-white p-4 shadow-xl sm:p-5 dark:bg-neutral-900`}>{children}</div>
    </div>
  );
}
