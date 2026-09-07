// Buscador del catálogo: nombre, marca, categoría/subcategoría y código
// (SKU) — tolerante a acentos, guiones y errores de tipeo chicos, sin
// depender de ninguna librería externa (todo el matching es un puñado de
// funciones puras, mismo criterio "cero dependencias" ya usado en el resto
// del sitio).
import type { Producto } from "../data/catalog";

// Sin tildes/diéresis y en minúsculas — así "iluminación" y "iluminacion"
// (o "Ñ"/"n") se tratan igual sin tener que listar cada variante a mano.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Además de normalizarTexto, saca todo lo que no sea letra/número — para
// que el código de producto se pueda buscar sin importar el guion exacto
// ("ilu001" encuentra "ILU-001", "ilu 001" también).
function normalizarCodigo(texto: string): string {
  return normalizarTexto(texto).replace(/[^a-z0-9]/g, "");
}

// Distancia de Damerau-Levenshtein restringida (inserciones/borrados/
// sustituciones + transposición de dos letras adyacentes como un solo
// error) — cubre los 4 tipos de error de tipeo más comunes, incluyendo
// escribir dos letras al revés ("faors" en vez de "faros"), que la
// distancia de Levenshtein clásica cuenta como 2 errores en vez de 1. Con
// palabras cortas (nombres de producto, marcas) el costo es insignificante
// incluso sin memoización.
function distanciaLevenshtein(a: string, b: string): number {
  const filas = a.length + 1;
  const columnas = b.length + 1;
  const dp: number[][] = Array.from({ length: filas }, (_, i) => [i, ...Array(columnas - 1).fill(0)]);
  for (let j = 0; j < columnas; j++) dp[0][j] = j;
  for (let i = 1; i < filas; i++) {
    for (let j = 1; j < columnas; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let valor = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, dp[i - 2][j - 2] + costo);
      }
      dp[i][j] = valor;
    }
  }
  return dp[filas - 1][columnas - 1];
}

// Cuánto margen de error se tolera según el largo de la palabra más corta
// de las dos — exigir 0 en palabras muy cortas evita que, por ejemplo,
// "led" fuzzy-matchee con la mitad de las marcas del catálogo.
function umbralPermitido(largo: number): number {
  if (largo <= 3) return 0;
  if (largo <= 5) return 1;
  return 2;
}

function palabraCoincide(palabraBusqueda: string, palabraObjetivo: string): boolean {
  if (palabraObjetivo.includes(palabraBusqueda)) return true;
  const largoMenor = Math.min(palabraBusqueda.length, palabraObjetivo.length);
  return distanciaLevenshtein(palabraBusqueda, palabraObjetivo) <= umbralPermitido(largoMenor);
}

export function coincideProducto(producto: Producto, busquedaCruda: string): boolean {
  const busqueda = normalizarTexto(busquedaCruda);
  if (!busqueda) return true;

  // Código exacto o parcial, ignorando guiones/espacios/mayúsculas — el
  // caso más común es que alguien escriba el SKU sin el guion.
  if (normalizarCodigo(producto.sku).includes(normalizarCodigo(busqueda))) return true;

  const camposTexto = [producto.nombre, producto.marca, producto.categoria, producto.subcategoria]
    .map(normalizarTexto)
    .join(" ");

  // Coincidencia directa (substring) primero — cubre la mayoría de los
  // casos reales sin pagar el costo de comparar letra por letra.
  if (camposTexto.includes(busqueda)) return true;

  // Si no hubo coincidencia directa, se compara palabra por palabra
  // tolerando errores chicos de tipeo — cada palabra de la búsqueda tiene
  // que encontrar al menos una palabra parecida en el producto (AND),
  // así una búsqueda de dos palabras no matchea con solo que una de ellas
  // aparezca en cualquier lado.
  const palabrasObjetivo = camposTexto.split(/\s+/).filter(Boolean);
  const palabrasBusqueda = busqueda.split(/\s+/).filter(Boolean);
  return palabrasBusqueda.every((pb) => palabrasObjetivo.some((po) => palabraCoincide(pb, po)));
}
