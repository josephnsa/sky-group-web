// Mismos valores que --duration-*/--ease-brand en src/styles/global.css,
// en formato JS para los componentes que usan framer-motion — evita que el
// movimiento CSS y el de framer-motion diverjan con el tiempo.
export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
} as const;

export const EASE_BRAND = [0.16, 1, 0.3, 1] as const;
