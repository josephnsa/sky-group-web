// "Logos" simplificados de medios de pago — insignias de texto con el color
// de marca de cada uno (no los logotipos oficiales con derechos de autor,
// que no se pueden usar sin licencia), mismo criterio ya aplicado en el
// resto del sitio para íconos temáticos hechos a mano.
interface IconProps {
  class?: string;
}

export function BadgeVisa(p: IconProps) {
  return (
    <span class={`flex items-center justify-center rounded-md bg-[#1A1F71] px-3 py-1.5 font-bold italic text-white ${p.class ?? ""}`}>
      VISA
    </span>
  );
}

export function BadgeAmex(p: IconProps) {
  return (
    <span class={`flex items-center justify-center rounded-md bg-[#2E77BC] px-3 py-1.5 text-xs font-bold text-white ${p.class ?? ""}`}>
      AMEX
    </span>
  );
}

export function BadgeYape(p: IconProps) {
  return (
    <span class={`flex items-center justify-center rounded-md bg-[#742384] px-3 py-1.5 text-sm font-bold text-white ${p.class ?? ""}`}>
      yape
    </span>
  );
}

export function BadgePlin(p: IconProps) {
  return (
    <span class={`flex items-center justify-center rounded-md bg-[#00BFB3] px-3 py-1.5 text-sm font-bold text-white ${p.class ?? ""}`}>
      Plin
    </span>
  );
}

export function BadgeEfectivo(p: IconProps) {
  return (
    <span class={`flex items-center justify-center gap-1 rounded-md bg-brand-green px-3 py-1.5 text-xs font-bold text-white ${p.class ?? ""}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5" aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      Efectivo
    </span>
  );
}
