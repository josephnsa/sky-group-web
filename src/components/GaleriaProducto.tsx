import { useState } from "preact/hooks";

interface Props {
  nombre: string;
  imagenes: string[]; // ya incluye la principal en la posición 0
}

export default function GaleriaProducto({ nombre, imagenes }: Props) {
  const [activa, setActiva] = useState(0);

  return (
    <div>
      <img
        src={imagenes[activa]}
        alt={nombre}
        class="w-full rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
      />
      {imagenes.length > 1 && (
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
        </div>
      )}
    </div>
  );
}
