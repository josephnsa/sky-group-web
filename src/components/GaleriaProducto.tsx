import { useEffect, useState } from "preact/hooks";

interface Props {
  nombre: string;
  imagenes: string[]; // ya incluye la principal en la posición 0
  video?: string;
}

// Índice especial (no una posición real de `imagenes`) para representar
// "el video está activo" en el mismo estado que ya usábamos para las fotos,
// sin sumar un segundo booleano que haya que mantener sincronizado.
const VIDEO = -1;

export default function GaleriaProducto({ nombre, imagenes, video }: Props) {
  const [activa, setActiva] = useState(0);
  const [zoom, setZoom] = useState(false);
  const hayMiniaturas = imagenes.length > 1 || !!video;

  useEffect(() => {
    if (!zoom) return;
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
    }
    document.addEventListener("keydown", alPresionarTecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = "";
    };
  }, [zoom]);

  return (
    <div>
      {activa === VIDEO && video ? (
        <video
          src={video}
          controls
          autoplay
          class="w-full rounded-lg border border-neutral-200 dark:border-neutral-800"
        />
      ) : (
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Ampliar imagen"
          class="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
        >
          <img
            src={imagenes[activa]}
            alt={nombre}
            class="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span class="absolute bottom-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round" />
            </svg>
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

      {zoom && activa !== VIDEO && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
        >
          <img
            src={imagenes[activa]}
            alt={nombre}
            class="max-h-full max-w-full cursor-zoom-out object-contain"
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Cerrar"
            class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors duration-200 hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
