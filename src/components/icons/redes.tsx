// Íconos reales de cada red social (glifo oficial simplificado, un solo
// color vía fill="currentColor") — mismo patrón de SVG inline a mano que
// src/components/icons/categorias.tsx y ui.tsx, sin sumar una librería de
// íconos nueva solo para esto.
interface IconProps {
  class?: string;
}

export function IconFacebook(p: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class={p.class} aria-hidden="true">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function IconInstagram(p: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class={p.class} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTiktok(p: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class={p.class} aria-hidden="true">
      <path d="M16.5 2h-3.1v13.7a2.8 2.8 0 1 1-2.4-2.77v-3.15a5.95 5.95 0 1 0 5.5 5.93V8.9a7.4 7.4 0 0 0 4.5 1.53V7.33A4.3 4.3 0 0 1 16.5 3Z" />
    </svg>
  );
}

export function IconYoutube(p: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class={p.class} aria-hidden="true">
      <path d="M21.6 7.4a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2 12a28 28 0 0 0 .4 4.6 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.6ZM10 15V9l5.2 3Z" />
    </svg>
  );
}

export const ICONO_POR_RED: Record<string, (p: IconProps) => ReturnType<typeof IconFacebook>> = {
  facebook: IconFacebook,
  instagram: IconInstagram,
  tiktok: IconTiktok,
  youtube: IconYoutube,
};
