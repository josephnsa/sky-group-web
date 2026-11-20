// Muestra la descripción de un producto respetando cómo se escribió en el panel:
// - Cada salto de línea es un párrafo nuevo.
// - Las líneas que empiezan con viñeta ("-", "•", "●", "▪", "✓", "✅", la viñeta de Word,
//   etc.) forman una lista con puntos; las que empiezan con "1." o "1)" una lista numerada.
//   Así funciona tanto escrito a mano como copiado y pegado desde Word, WhatsApp o una web.
// - Una línea corta que termina en ":" (por ejemplo "Beneficios:") es un subtítulo.
// Se usa en la página del producto, en la vista rápida y en la vista previa del panel.

type Bloque = { tipo: "parrafo" | "titulo"; texto: string } | { tipo: "lista"; numerada: boolean; items: string[] };

// Viñetas comunes al escribir o pegar. El guion y el asterisco necesitan un espacio después
// (para no confundir "-40 °C" con una viñeta). Incluye la viñeta de Word (U+F0B7) y la "o" de segundo nivel.
const VINETA = /^\s*(?:[-–—*]\s+|[•●○◦▪▫■□►▸➢➤→✓✔✗☑✅⭐·\uF0B7\uF0A7\uF076\uF0D8]\uFE0F?\s*|o\t\s*)/u;
const NUMERO = /^\s*\d{1,2}[.)]\s+/;

export function bloquesDescripcion(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const cruda of (texto || "").replace(/\r/g, "").split("\n")) {
    const linea = cruda.trim();
    if (!linea) continue;
    const numerada = NUMERO.test(linea);
    if (numerada || VINETA.test(linea)) {
      const item = linea.replace(numerada ? NUMERO : VINETA, "").trim();
      if (!item) continue;
      const ultimo = bloques[bloques.length - 1];
      if (ultimo?.tipo === "lista" && ultimo.numerada === numerada) ultimo.items.push(item);
      else bloques.push({ tipo: "lista", numerada, items: [item] });
    } else if (linea.endsWith(":") && linea.length <= 60) {
      bloques.push({ tipo: "titulo", texto: linea });
    } else {
      bloques.push({ tipo: "parrafo", texto: linea });
    }
  }
  return bloques;
}

// "Protección contra la fricción: Ayuda a..." → la parte antes de ":" en negrita.
function Item({ texto }: { texto: string }) {
  const i = texto.indexOf(":");
  if (i > 0 && i <= 50 && i < texto.length - 1) {
    return (
      <>
        <strong class="font-semibold text-neutral-900 dark:text-white">{texto.slice(0, i + 1)}</strong>
        {texto.slice(i + 1)}
      </>
    );
  }
  return <>{texto}</>;
}

interface Props {
  texto: string;
  compacto?: boolean;
}

export default function DescripcionProducto({ texto, compacto = false }: Props) {
  const bloques = bloquesDescripcion(texto);
  if (bloques.length === 0) return null;
  return (
    <div class={`${compacto ? "space-y-2 text-sm" : "space-y-3"} text-neutral-700 dark:text-neutral-300`}>
      {bloques.map((b, i) =>
        b.tipo === "lista" ? (
          <ul key={i} class="space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} class="flex gap-2">
                {b.numerada ? (
                  <span class="min-w-[1.25rem] flex-none font-semibold text-brand-blue-dark dark:text-brand-blue">{j + 1}.</span>
                ) : (
                  <span class="mt-[0.55em] h-1.5 w-1.5 flex-none rounded-full bg-brand-blue" aria-hidden="true" />
                )}
                <span>
                  <Item texto={item} />
                </span>
              </li>
            ))}
          </ul>
        ) : b.tipo === "titulo" ? (
          <p key={i} class="pt-1 font-semibold text-neutral-900 dark:text-white">
            {b.texto}
          </p>
        ) : (
          <p key={i}>{b.texto}</p>
        ),
      )}
    </div>
  );
}
