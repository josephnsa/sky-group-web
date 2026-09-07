import { useEffect, useRef, useState } from "preact/hooks";
import { motion, useMotionValue, animate } from "framer-motion";
import { IconArrowRight, IconWhatsapp } from "./icons/ui";
import { NEGOCIO } from "../consts";
import type { DiapositivaCarrusel } from "../data/catalog";

type BannerSlide = DiapositivaCarrusel;

interface Props {
  slidesIniciales: BannerSlide[];
}

const INTERVALO_MS = 5000;
// A partir de cuántos px de arrastre (o velocidad) se considera un "swipe"
// real y no un simple clic — mismo umbral que usan la mayoría de carruseles
// tipo Flickity (referencia: gpc.pe, que arrastra en vez de usar flechas).
const UMBRAL_ARRASTRE_PX = 60;
const UMBRAL_VELOCIDAD = 400;
const RESORTE = { type: "spring", stiffness: 300, damping: 35 } as const;

const mensajeWa = encodeURIComponent(`Hola ${NEGOCIO.razonSocial}, quisiera hacer una consulta.`);

// El carrusel ya no genera diapositivas automáticas por categoría — muestra
// únicamente lo que el admin sube en /admin/carrusel (tabla `carousel_slides`
// en Supabase). Cada imagen puede llevar un `enlace` opcional: si lo tiene,
// se superpone un botón "Ver todo" hacia esa página (ej. subir una foto de
// la categoría Iluminación + enlace "/catalogo/iluminacion" → aparece un
// botón "Ver todo" que lleva ahí); sin enlace, la imagen se muestra sola.
//
// Las diapositivas llegan como prop (`slidesIniciales`), ya traídas en
// build-time por catalog.ts (mismo mecanismo que categorías/productos) —
// antes este componente las pedía a Supabase recién al montar en el
// navegador, así que la sección más visible de Home (el carrusel, que
// funciona como el hero) se veía completamente en blanco hasta que
// terminaban de descargarse Supabase+framer-motion Y volvía la respuesta de
// red — varios cientos de ms hasta más de un segundo en una conexión real.
// Con la imagen ya en el HTML inicial, se ve al instante. La contrapartida
// (igual que con categorías/productos) es que un cambio del admin necesita
// un rebuild del sitio para publicarse, no aparece solo al recargar.
export default function PromoCarousel({ slidesIniciales }: Props) {
  const [diapositivas] = useState<BannerSlide[]>(slidesIniciales);
  const [indice, setIndice] = useState(0);
  const [enPausa, setEnPausa] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  // Ancho real del carril en estado (no solo leído del ref de forma
  // imperativa) porque `dragConstraints` necesita un valor fresco en cada
  // render para reflejar el rango de arrastre completo de la tira — ver
  // más abajo por qué esto es el fix real del bug de arrastre.
  const [ancho, setAncho] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const reducirMovimiento = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Mueve el carril a la posición de reposo de `i`. Se llama explícitamente
  // (no solo vía el `useEffect` de abajo) porque un arrastre corto que NO
  // cambia de índice necesita el mismo "vuelve a tu lugar" — bug real
  // encontrado con Playwright: al arrastrar poco y soltar, el carril se
  // quedaba pegado en la posición intermedia donde se soltó el mouse, en vez
  // de volver, porque framer-motion no reanima `animate` cuando el valor
  // "objetivo" (el mismo índice de antes) no cambió.
  function iral(i: number, animar = true) {
    const a = contenedorRef.current?.offsetWidth ?? 0;
    if (animar) animate(x, -i * a, RESORTE);
    else x.set(-i * a);
  }

  // Mide el ancho real al montar y en cada resize (celular girado, etc.).
  useEffect(() => {
    function medir() {
      setAncho(contenedorRef.current?.offsetWidth ?? 0);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  // Si el ancho cambia, reubicar el carril al instante (sin resorte) en la
  // posición de reposo correcta para el índice actual.
  useEffect(() => {
    if (ancho) iral(indice, false);
  }, [ancho]);

  useEffect(() => {
    iral(indice);
  }, [indice]);

  useEffect(() => {
    if (enPausa || arrastrando || reducirMovimiento.current || diapositivas.length <= 1) return;
    const t = setInterval(() => {
      setIndice((i) => (i + 1) % diapositivas.length);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [enPausa, arrastrando, diapositivas.length]);

  function irA(i: number) {
    setIndice(((i % diapositivas.length) + diapositivas.length) % diapositivas.length);
  }

  // El contenedor se renderiza SIEMPRE, incluso con 0 diapositivas (el admin
  // todavía no subió ninguna) — bug real encontrado en su momento: devolver
  // `null` acá dejaba el island sin ningún elemento con tamaño que observar,
  // y como este componente usa `client:visible` (se hidrata cuando el
  // elemento entra en pantalla), nunca llegaba a hidratarse en absoluto.
  return (
    <div
      data-testid="promo-carousel"
      class="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2458/910]"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
      ref={contenedorRef}
    >
      {/* Igual que gpc.pe (Flickity): el carril completo se arrastra con el
      mouse/dedo en vez de depender de flechas. `x` es un MotionValue propio
      (no un prop `animate` normal) para poder forzar el "snap back" a mano
      en onDragEnd incluso cuando el índice no cambia.
      Bug real corregido: `dragConstraints` estaba fijo en un solo punto
      ({left:0, right:0}), así que framer-motion trataba CUALQUIER arrastre
      como "fuera de rango" y lo escalaba por `dragElastic` (0.6) — el carril
      se movía muy poco por debajo del dedo/mouse, sensación de "no
      responde". El rango real ahora es el ancho completo de la tira
      (todas las diapositivas), así que arrastrar sigue al puntero 1:1 y solo
      hay resistencia elástica genuina en los extremos (antes de la primera
      diapositiva / después de la última), como un carrusel de arrastre real. */}
      <motion.div
        class="flex h-full w-full cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -Math.max(0, diapositivas.length - 1) * ancho, right: 0 }}
        dragElastic={0.15}
        onDragStart={() => setArrastrando(true)}
        onDragEnd={(_e, info) => {
          setArrastrando(false);
          let nuevo = indice;
          if (info.offset.x < -UMBRAL_ARRASTRE_PX || info.velocity.x < -UMBRAL_VELOCIDAD) {
            nuevo = (indice + 1) % diapositivas.length;
          } else if (info.offset.x > UMBRAL_ARRASTRE_PX || info.velocity.x > UMBRAL_VELOCIDAD) {
            nuevo = (indice - 1 + diapositivas.length) % diapositivas.length;
          }
          if (nuevo === indice) {
            // El índice no cambia: nadie más va a reanimar `x`, hay que
            // forzar el regreso a la posición de reposo acá mismo.
            iral(indice);
          } else {
            setIndice(nuevo);
          }
        }}
      >
        {diapositivas.map((d) => (
          <div
            key={d.id}
            class="relative h-full w-full flex-none overflow-hidden"
            style={{ background: "linear-gradient(to bottom, rgb(205,220,231), rgb(199,204,206) 50%, rgb(194,188,181))" }}
          >
            {/* object-contain (no cover): las imágenes subidas desde el
            panel de admin pueden traer cualquier proporción — mostrarla
            ENTERA evita recortar logos/texto que el admin haya incluido,
            mismo criterio ya validado con el banner real de SKY Group. */}
            <img
              src={d.imagen_url}
              alt={d.titulo ?? ""}
              draggable={false}
              class="relative h-full w-full select-none object-contain"
            />
            {/* Sin enlace, la imagen se muestra sola (pura imagen, sin
            degradado ni botones) — con enlace, aparece el botón "Ver todo"
            hacia esa página + el CTA de WhatsApp de siempre. */}
            {d.enlace && (
              <>
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true"></div>
                <div class="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-6 sm:p-10 lg:p-14">
                  <div class="flex flex-wrap items-center gap-3">
                    <a
                      href={d.enlace}
                      draggable={false}
                      class="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-lg transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-neutral-100 active:scale-95 sm:px-6 sm:py-3"
                    >
                      Ver todo
                      <IconArrowRight class="h-4 w-4" />
                    </a>
                    <a
                      href={`https://wa.me/${NEGOCIO.whatsappNumero}?text=${mensajeWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      class="inline-flex w-fit items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-green-700 active:scale-95 sm:px-6 sm:py-3"
                    >
                      <IconWhatsapp class="h-4 w-4" />
                      Cotizar por WhatsApp
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </motion.div>

      {diapositivas.length > 1 && (
        <div class="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {diapositivas.map((d, i) => (
            <button
              key={d.id}
              type="button"
              aria-label={`Ir a la diapositiva ${i + 1}`}
              onClick={() => irA(i)}
              class={`pointer-events-auto h-2 rounded-full transition-all duration-300 ${
                i === indice ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
