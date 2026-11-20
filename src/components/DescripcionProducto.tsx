// Muestra la descripción de un producto respetando cómo se escribió en el panel:
// - Cada salto de línea es un párrafo nuevo.
// - Las líneas que empiezan con "-", "•" o "*" forman una lista con viñetas.
// - Una línea corta que termina en ":" (por ejemplo "Beneficios:") es un subtítulo.
// Se usa en la página del producto, en la vista rápida y en la vista previa del panel.

type Bloque = { tipo: "parrafo" | "titulo"; texto: string } | { tipo: "lista"; items: string[] };

const VINETA = /^\s*[-•*·–]\s+/;

export function bloquesDescripcion(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const cruda of (texto || "").replace(/\r/g, "").split("\n")) {
    const linea = cruda.trim();
    if (!linea) continue;
    if (VINETA.test(linea)) {
      const item = linea.replace(VINETA, "");
      const ultimo = bloques[bloques.length - 1];
      if (ultimo?.tipo === "lista") ultimo.items.push(item);
      else bloques.push({ tipo: "lista", items: [item] });
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
                <span class="mt-[0.55em] h-1.5 w-1.5 flex-none rounded-full bg-brand-blue" aria-hidden="true" />
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
