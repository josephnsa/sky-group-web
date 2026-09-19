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

export default function GaleriaProducto({ nombre, imagenes, video }: Props) {
  const [activa, setActiva] = useState(0);
  const hayMiniaturas = imagenes.length > 1 || !!video;

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
        <img
          src={imagenes[activa]}
          alt={nombre}
          class="w-full rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
        />
      )}
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
