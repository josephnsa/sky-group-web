// Íconos de interfaz, todo SVG inline a mano (mismo patrón ya usado en todo
// el sitio: cero dependencias, se colorean solos con currentColor en dark
// mode). Este archivo solo estandariza stroke-width (antes mezclado entre
// 1.75/1.8/2 según el componente) y les da un nombre reusable.
interface IconProps {
  class?: string;
}

export function IconChevronDown({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconClose({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconSearch({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M21 21l-4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconCart({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconSun({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconMoon({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round" />
    </svg>
  );
}

export function IconMenu({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round" />
    </svg>
  );
}

export function IconPlus({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke-linecap="round" />
    </svg>
  );
}

export function IconMinus({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class={className} aria-hidden="true">
      <path d="M5 12h14" stroke-linecap="round" />
    </svg>
  );
}

export function IconArrowRight({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

export function IconWhatsapp({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" class={className} aria-hidden="true">
      <path d="M16.001 3C9.11 3 3.5 8.611 3.5 15.5c0 2.316.63 4.484 1.727 6.345L3 29l7.328-2.19A12.44 12.44 0 0 0 16 28.5C22.89 28.5 28.5 22.889 28.5 16S22.891 3 16.001 3Zm0 22.75c-1.998 0-3.86-.55-5.457-1.503l-.39-.232-4.35 1.3 1.318-4.24-.254-.402a10.2 10.2 0 0 1-1.618-5.523c0-5.68 4.62-10.3 10.751-10.3 5.68 0 10.3 4.62 10.3 10.3s-4.62 10.3-10.3 10.3ZM21.6 18.9c-.31-.155-1.837-.907-2.122-1.011-.285-.104-.492-.155-.699.155-.207.31-.803 1.01-.984 1.218-.181.207-.362.233-.672.078-.31-.155-1.31-.483-2.495-1.539-.923-.823-1.547-1.84-1.728-2.15-.181-.31-.02-.478.136-.633.14-.14.31-.362.465-.543.155-.181.207-.31.31-.517.104-.207.052-.388-.026-.543-.078-.155-.699-1.686-.958-2.31-.252-.606-.508-.524-.699-.534l-.595-.01a1.14 1.14 0 0 0-.828.388c-.285.31-1.088 1.063-1.088 2.594 0 1.53 1.114 3.01 1.269 3.218.155.207 2.192 3.348 5.313 4.694.742.32 1.322.512 1.774.655.746.237 1.424.204 1.961.124.598-.09 1.837-.751 2.096-1.476.259-.725.259-1.347.181-1.476-.078-.13-.284-.207-.594-.362Z" />
    </svg>
  );
}

export function IconChat({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5Z" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M8 10h8M8 13h5" stroke-linecap="round" />
    </svg>
  );
}

export function IconBox({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M3 8l9-5 9 5-9 5-9-5Z" stroke-linejoin="round" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" stroke-linejoin="round" />
    </svg>
  );
}

export function IconShield({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" stroke-linejoin="round" />
    </svg>
  );
}

export function IconTruck({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <path d="M2 7h11v9H2z" stroke-linejoin="round" />
      <path d="M13 10h4l3 3v3h-7z" stroke-linejoin="round" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </svg>
  );
}

export function IconUser({ class: className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}
