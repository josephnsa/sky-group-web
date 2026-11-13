// Pedido del cliente (video de observaciones "Productos y marcas"): dentro de
// cada producto se muestra "Marca: SKY", y si el producto no tiene marca real
// se muestra "Marca: S/M" (sin marca), nunca "Genérico" ni "Sin marca".
const VALORES_SIN_MARCA = new Set(["", "s/m", "sm", "sin marca", "generico", "genérico", "generica", "genérica", "n/a", "-"]);

export function esSinMarca(marca: string | null | undefined): boolean {
  return VALORES_SIN_MARCA.has((marca ?? "").trim().toLowerCase());
}

export function marcaVisible(marca: string | null | undefined): string {
  return esSinMarca(marca) ? "S/M" : marca!.trim();
}
