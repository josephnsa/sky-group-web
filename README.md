# Sitio de autopartes — Astro + Preact + Tailwind

Sitio informativo + catálogo + carrito + checkout por WhatsApp, 100% estático,
pensado para hosting gratuito (Cloudflare Pages). Ver el plan completo en
`C:\Users\salaz\.claude\plans\clever-dreaming-aurora.md`.

## Desarrollo local

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera /dist (build de producción)
npm run preview   # sirve /dist localmente para probarlo como en producción
```

## Estado actual

El sitio funciona de punta a punta con **datos de ejemplo** en
[`src/data/catalog.ts`](src/data/catalog.ts). Antes de publicar, hay que
completar lo marcado como `TODO PENDIENTE` en:

- **[`src/consts.ts`](src/consts.ts)** — datos del negocio: nombre, RUC, razón
  social, dirección, teléfono, correo y **número de WhatsApp** (clave para el
  checkout).
- **`RECLAMOS.appsScriptUrl`** en el mismo archivo — ver
  [`docs/libro-de-reclamaciones.md`](docs/libro-de-reclamaciones.md) para
  crear el backend gratuito (Google Apps Script) del Libro de Reclamaciones.
- **`src/pages/nosotros.astro`** — texto real de la empresa.
- **Catálogo real vía Google Sheets** — todavía no está conectado (pendiente:
  el usuario compartió el Sheet). Mientras tanto, el catálogo vive en
  `src/data/catalog.ts` con el mismo esquema de columnas que tendrá el Sheet
  (ver `data-template/catalogo-plantilla.csv`). Cuando el Sheet esté listo, se
  reemplaza la fuente de datos por un fetch a la Google Sheets API en build
  time, sin tocar el resto del sitio (páginas, carrito, WhatsApp ya están
  desacoplados del origen de los datos).
- **Íconos PWA** ([`public/icons/icon.svg`](public/icons/icon.svg)) — es un
  ícono placeholder; para producción conviene generar íconos PNG/maskable
  reales de la marca (ej. con https://realfavicongenerator.net).

## Estructura

```
src/
  consts.ts              datos del negocio (editar antes de publicar)
  data/catalog.ts         catálogo (placeholder hasta conectar Google Sheets)
  lib/cart-store.ts       estado del carrito (nanostores + localStorage)
  lib/whatsapp.ts          arma el mensaje/enlace de checkout por WhatsApp
  layouts/Layout.astro     layout base (head, header, footer)
  components/              Header, Footer, tarjetas de producto, carrito,
                            buscador, formulario de reclamos — islas Preact
                            solo donde hay interactividad real
  pages/                   Inicio, Nosotros, Contacto, Medios de pago,
                            Libro de Reclamaciones, Carrito, Catálogo
                            (índice, por categoría, ficha de producto)
data-template/
  catalogo-plantilla.csv  columnas exactas que debe tener el Google Sheet
docs/
  libro-de-reclamaciones.md   cómo montar el Apps Script del libro de reclamos
```

## Próximos pasos (ver plan completo para el detalle)

1. Completar los `TODO PENDIENTE` de `src/consts.ts`.
2. Armar el Apps Script del Libro de Reclamaciones (`docs/libro-de-reclamaciones.md`).
3. Conectar el catálogo real desde Google Sheets.
4. Subir a un repo de GitHub y conectar Cloudflare Pages (build command
   `npm run build`, output `dist`).
5. Conectar el dominio propio en Cloudflare Pages.
6. QA responsive + PWA ("Agregar a inicio") en un celular real antes de
   publicar.
