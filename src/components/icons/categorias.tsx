// Un ícono distinto por categoría real del catálogo (antes se repetía el
// mismo ícono de llave para las 11) — mismo patrón de SVG inline a mano,
// stroke-width 1.75 estandarizado.
import type { ComponentChildren } from "preact";

interface IconProps {
  class?: string;
}

function Svg({ class: className, children }: IconProps & { children: ComponentChildren }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconBulb(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.95V16h5v-.15c0-.8.4-1.5 1-1.95A6 6 0 0 0 12 3Z" stroke-linecap="round" stroke-linejoin="round" />
    </Svg>
  );
}

export function IconSparkle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke-linejoin="round" />
      <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" stroke-linejoin="round" />
    </Svg>
  );
}

export function IconBattery(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2" y="8" width="17" height="9" rx="1.5" />
      <path d="M19 11h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2" />
      <path d="M8 10l-2 3h3l-2 3" stroke-linecap="round" stroke-linejoin="round" />
    </Svg>
  );
}

export function IconTow(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M9.5 17h6M4 17V9a2 2 0 0 1 2-2h5l4 4h4a2 2 0 0 1 2 2v4" stroke-linecap="round" stroke-linejoin="round" />
    </Svg>
  );
}

export function IconSpray(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 8V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3" stroke-linecap="round" />
      <rect x="7" y="8" width="9" height="13" rx="1.5" />
      <path d="M3 8h2M3 12h2M3 16h2" stroke-linecap="round" />
    </Svg>
  );
}

export function IconTape(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
    </Svg>
  );
}

export function IconRoofBox(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="9" width="18" height="7" rx="2.5" />
      <path d="M3 6h18M6 6V4M18 6V4" stroke-linecap="round" />
    </Svg>
  );
}

export function IconBriefcase(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" stroke-linecap="round" />
    </Svg>
  );
}

export function IconTrim(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 12c0-4.5 3.5-8 8-8s8 3.5 8 8-3.5 8-8 8" stroke-linecap="round" />
      <path d="M4 12h6" stroke-linecap="round" />
    </Svg>
  );
}

export function IconShieldCheck(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" stroke-linejoin="round" />
      <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
    </Svg>
  );
}

export function IconSeat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 4v7a2 2 0 0 0 2 2h4" stroke-linecap="round" />
      <path d="M8 13H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M17 12v-1a2 2 0 0 0-2-2h-1" stroke-linecap="round" />
    </Svg>
  );
}

export function IconWrench(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" stroke-linecap="round" stroke-linejoin="round" />
    </Svg>
  );
}

export const ICONO_POR_CATEGORIA: Record<string, (p: IconProps) => ReturnType<typeof IconWrench>> = {
  "Iluminación": IconBulb,
  "Accesorios Tuning y Decoración": IconSparkle,
  "Auxilio Vehicular": IconBattery,
  "Remolque": IconTow,
  "Limpieza y Pulido": IconSpray,
  "Cintas y Adhesivos": IconTape,
  "Equipamiento Exterior": IconRoofBox,
  "Para Trabajo y Negocio": IconBriefcase,
  "Molduras y Protectores": IconTrim,
  "Seguros": IconShieldCheck,
  "Interior y Confort": IconSeat,
};

export function iconoDeCategoria(categoria: string) {
  return ICONO_POR_CATEGORIA[categoria] ?? IconWrench;
}
