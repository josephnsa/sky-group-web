import { useState } from "preact/hooks";

interface Props {
  nombre: string;
  imagenes: string[]; // ya incluye la principal en la posición 0
  video?: string;
}

// Índice especial (no una posición real de `imagenes`) para representar
// "el video está activo" en el mismo estado que ya usábamos para las fotos,
// sin sumar un segundo booleano que haya que mantener sincronizado.
const VIDEO = -1;

const ZOOM_FACTOR = 2.2;

export default function GaleriaProducto({ nombre, imagenes, video }: Props) {
  const [activa, setActiva] = useState(0);
  // Zoom estilo Amazon: al pasar el mouse por encima (solo dispositivos con
  // puntero real, no táctiles) se amplía la imagen siguiendo el cursor en
  // el mismo lugar. Sin modal de pantalla completa — solo este hover.
  const [posicionMouse, setPosicionMouse] = useState({ x: 50, y: 50 });
  const [conMouseEncima, setConMouseEncima] = useState(false);
  const hayMiniaturas = imagenes.length > 1 || !!video;

  function alMoverMouse(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosicionMouse({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

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
        <div
          onMouseEnter={() => setConMouseEncima(true)}
          onMouseLeave={() => setConMouseEncima(false)}
          onMouseMove={alMoverMouse}
          class="relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
        >
          <img src={imagenes[activa]} alt={nombre} class="w-full object-cover" />
          {conMouseEncima && (
            <span
              class="pointer-events-none absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage: `url(${imagenes[activa]})`,
                backgroundSize: `${ZOOM_FACTOR * 100}%`,
                backgroundPosition: `${posicionMouse.x}% ${posicionMouse.y}%`,
              }}
            />
          )}
        </div>
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
    </div>
  );
}
