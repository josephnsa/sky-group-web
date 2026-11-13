import { useEffect, useRef, useState } from "preact/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { IconClose } from "./icons/ui";
import { DURATION, EASE_BRAND } from "../lib/motion";
import { videoEmbebible } from "../lib/enlaces";

interface Props {
  enlace: string;
  nombre: string;
}

const CLASE_BOTON =
  "inline-flex items-center gap-1 rounded-md border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue transition-colors duration-200 hover:bg-brand-blue/10";

// Botón "¡Conoce más!" de la ficha cuando el producto tiene un enlace
// cargado en el admin (columna enlace_conoce_mas). Si es un video de
// TikTok/YouTube se reproduce en un modal sin salir de la ficha (pedido del
// cliente); si es otro tipo de enlace se abre en una pestaña nueva.
export default function BotonConoceMas({ enlace, nombre }: Props) {
  const video = videoEmbebible(enlace);
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      botonRef.current?.focus();
    };
  }, [abierto]);

  if (!video) {
    return (
      <a href={enlace} target="_blank" rel="noopener noreferrer" class={CLASE_BOTON}>
        ¡Conoce más!
      </a>
    );
  }

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        class={CLASE_BOTON}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path d="M8 5v14l11-7Z" />
        </svg>
        ¡Conoce más!
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Video: ${nombre}`}
            onClick={(e: MouseEvent) => {
              if (e.target === e.currentTarget) setAbierto(false);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
          >
            <motion.div
              class={`flex max-h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-neutral-900 ${
                video.vertical ? "" : "max-w-3xl"
              }`}
              // Vertical (TikTok): el ancho sale del alto disponible para que
              // el video 9:16 entre completo sin bandas negras en pantallas
              // bajas (8rem = barra del título + "Ver en TikTok" + márgenes).
              style={video.vertical ? { maxWidth: "min(360px, calc((100dvh - 8rem) * 9 / 16))" } : undefined}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: DURATION.base, ease: EASE_BRAND }}
            >
              <div class="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
                <p class="min-w-0 truncate text-sm font-semibold text-neutral-900 dark:text-white">{nombre}</p>
                <button
                  ref={cerrarRef}
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar video"
                  class="shrink-0 rounded-md p-2 text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <IconClose class="h-4 w-4" />
                </button>
              </div>
              <div
                class={`relative w-full bg-black ${video.vertical ? "aspect-[9/16]" : "aspect-video"}`}
              >
                <iframe
                  src={video.embedUrl}
                  title={`Video de ${video.plataforma}: ${nombre}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  class="absolute inset-0 h-full w-full"
                />
              </div>
              {/* Respaldo visible: el reproductor insertado depende de TikTok y a
              veces no carga (red, región o bloqueadores); este botón siempre
              lleva al video en la app o la web de la plataforma. */}
              <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                <p class="text-xs text-neutral-500 dark:text-neutral-400">¿No se reproduce?</p>
                <a
                  href={enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-neutral-900"
                >
                  Ver en {video.plataforma}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
