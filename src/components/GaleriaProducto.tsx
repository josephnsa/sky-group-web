import { useEffect, useRef, useState } from "preact/hooks";
import { IconClose } from "./icons/ui";

interface Props {
  nombre: string;
  imagenes: string[]; // ya incluye la principal en la posición 0
  video?: string;
}

// Índice especial (no una posición real de `imagenes`) para representar
// "el video está activo" en el mismo estado que ya usábamos para las fotos,
// sin sumar un segundo booleano que haya que mantener sincronizado.
const VIDEO = -1;

function Flecha({ dir }: { dir: "izq" | "der" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
      <path d={dir === "izq" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export default function GaleriaProducto({ nombre, imagenes, video }: Props) {
  const [activa, setActiva] = useState(0);
  // Visor a pantalla completa dentro de la misma página (pedido del
  // cliente: ver la imagen más grande sin salir a otra pestaña).
  const [visor, setVisor] = useState<number | null>(null);
  // Zoom dentro del visor: muestra la foto a su resolución real (útil sobre
  // todo en celular, donde la foto ya ocupaba todo el ancho de la ficha).
  const [zoom, setZoom] = useState(false);
  const zonaRef = useRef<HTMLDivElement>(null);
  const toqueX = useRef<number | null>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);
  const hayMiniaturas = imagenes.length > 1 || !!video;
  const varias = imagenes.length > 1;

  function mover(paso: number) {
    setZoom(false);
    setVisor((v) => (v === null ? v : (v + paso + imagenes.length) % imagenes.length));
  }

  // Cierra dejando la ficha en la última foto vista (sirve igual para la X,
  // el fondo y la tecla Escape, que no ve el estado actualizado).
  function cerrar() {
    setZoom(false);
    setVisor((v) => {
      if (v !== null) setActiva(v);
      return null;
    });
    abrirRef.current?.focus();
  }

  function alternarZoom(e: MouseEvent) {
    const img = e.currentTarget as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    // Solo tiene sentido si la foto real es más grande que como se ve.
    if (!zoom && img.naturalWidth <= rect.width * 1.15) return;
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const activar = !zoom;
    setZoom(activar);
    if (activar) {
      // Centra el zoom en el punto tocado.
      requestAnimationFrame(() => {
        const z = zonaRef.current;
        if (!z) return;
        z.scrollLeft = fx * z.scrollWidth - z.clientWidth / 2;
        z.scrollTop = fy * z.scrollHeight - z.clientHeight / 2;
      });
    }
  }

  useEffect(() => {
    if (visor === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight") mover(1);
      else if (e.key === "ArrowLeft") mover(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [visor === null]);

  return (
    // min-w-0: es un ítem de la grilla de la ficha; sin esto, con 6 o más
    // miniaturas la fila (que tiene su propio scroll) ensanchaba la columna
    // y la página se desbordaba a lo ancho en celular.
    <div class="min-w-0">
      {activa === VIDEO && video ? (
        <video
          src={video}
          controls
          autoplay
          class="w-full rounded-lg border border-neutral-200 dark:border-neutral-800"
        />
      ) : (
        <button
          ref={abrirRef}
          type="button"
          onClick={() => setVisor(activa)}
          aria-label="Ver imagen más grande"
          class="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
        >
          <img src={imagenes[activa]} alt={nombre} class="w-full object-cover" />
          <span class="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white opacity-80 transition-opacity duration-200 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
            </svg>
            Ampliar
          </span>
        </button>
      )}
      <p class="mt-1.5 text-center text-xs text-neutral-400 dark:text-neutral-500">Imágenes referenciales</p>
      {hayMiniaturas && (
        <div class="mt-3 flex gap-2 overflow-x-auto">
          {imagenes.map((src, i) => (
            <button
              type="button"
              key={src}
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1}`}
              class={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors duration-200 ${
                i === activa
                  ? "border-brand-blue"
                  : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
              }`}
            >
              <img src={src} alt="" class="h-full w-full object-cover" />
            </button>
          ))}
          {video && (
            <button
              type="button"
              onClick={() => setActiva(VIDEO)}
              aria-label="Ver video del producto"
              class={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-neutral-900 transition-colors duration-200 ${
                activa === VIDEO ? "border-brand-blue" : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="h-6 w-6" aria-hidden="true">
                <path d="M8 5v14l11-7Z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {visor !== null && (
        <div
          class="fixed inset-0 z-[60] flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ${visor + 1} de ${imagenes.length}: ${nombre}`}
          onClick={(e: MouseEvent) => {
            if (e.target === e.currentTarget) cerrar();
          }}
          onTouchStart={(e: TouchEvent) => (toqueX.current = e.touches[0].clientX)}
          onTouchEnd={(e: TouchEvent) => {
            // Con zoom activo, deslizar recorre la foto en vez de cambiarla.
            if (toqueX.current === null || !varias || zoom) return;
            const dx = e.changedTouches[0].clientX - toqueX.current;
            if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
            toqueX.current = null;
          }}
        >
          <div class="flex items-center justify-between px-4 py-3 text-white">
            <p class="min-w-0 truncate text-sm">
              {nombre}
              {varias && <span class="ml-2 text-white/60">{visor + 1} / {imagenes.length}</span>}
            </p>
            <button
              ref={cerrarRef}
              type="button"
              onClick={cerrar}
              aria-label="Cerrar imagen"
              class="shrink-0 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25"
            >
              <IconClose class="h-5 w-5" />
            </button>
          </div>

          <div
            ref={zonaRef}
            class={`relative min-h-0 flex-1 px-4 pb-4 ${zoom ? "overflow-auto" : "flex items-center justify-center overflow-hidden"}`}
            onClick={(e: MouseEvent) => {
              if (e.target === e.currentTarget) cerrar();
            }}
          >
            <img
              src={imagenes[visor]}
              alt={`${nombre} — foto ${visor + 1}`}
              onClick={alternarZoom}
              title={zoom ? "Toca para alejar" : "Toca para acercar"}
              class={`rounded-md bg-white shadow-2xl ${
                zoom ? "m-auto block max-w-none cursor-zoom-out" : "max-h-full max-w-full cursor-zoom-in object-contain"
              }`}
            />
            {varias && !zoom && (
              <>
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  aria-label="Foto anterior"
                  class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white transition-colors hover:bg-white/30 sm:left-6"
                >
                  <Flecha dir="izq" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  aria-label="Foto siguiente"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white transition-colors hover:bg-white/30 sm:right-6"
                >
                  <Flecha dir="der" />
                </button>
              </>
            )}
          </div>

          {varias && (
            <div class="flex justify-center gap-2 overflow-x-auto px-4 pb-4">
              {imagenes.map((src, i) => (
                <button
                  type="button"
                  key={src}
                  onClick={() => {
                    setZoom(false);
                    setVisor(i);
                  }}
                  aria-label={`Ver foto ${i + 1}`}
                  class={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-white transition-opacity ${
                    i === visor ? "border-brand-blue opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" class="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
