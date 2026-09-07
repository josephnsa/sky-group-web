# Conectar sky.com.pe al hosting de Cloudflare

Guía para cuando decidas pasar de la URL temporal `*.workers.dev` al dominio real.

## Situación actual (verificada 2026-09-07)

- El sitio está desplegado en Cloudflare Workers, URL estable:
  `https://sky-group-web.salazar-atalayaj.workers.dev`
  (⚠️ no usar URLs con un hash delante como `e93a3812-sky-group-web...` — esas
  quedan fijas a un deploy específico, no a la versión más reciente).
- El dominio `sky.com.pe` hoy tiene su DNS en **Soluciones Web Perú**
  (nameservers `ns1.solucioneswebperu.com` / `ns2.solucioneswebperu.com`) y
  apunta a un sitio distinto, todavía en uso.

## Por qué hace falta mover los nameservers (verificado en la documentación oficial de Cloudflare)

- Un **Custom Domain** de Cloudflare Workers exige que el dominio sea una
  "zona" activa de Cloudflare (nameservers en Cloudflare) — no alcanza con
  un CNAME desde otro proveedor de DNS, ni para el dominio raíz ni para un
  subdominio, en este tipo de proyecto (Workers, no el Pages clásico).
- **Mover los nameservers NO transfiere ni afecta la titularidad del
  dominio** — sigue siendo tuyo, comprado donde está — solo cambia quién
  responde las consultas DNS. Es reversible: alcanza con volver a poner los
  nameservers de Soluciones Web Perú si hiciera falta.
- Si en el futuro se quisiera evitar tocar el dominio raíz, la alternativa es
  usar un subdominio (ej. `tienda.sky.com.pe`) con un CNAME externo apuntando
  al proyecto — pero eso requeriría migrar el proyecto de "Workers" a
  "Pages" clásico primero (los Custom Domains de Pages sí aceptan CNAME
  externo para subdominios, no para el dominio raíz).

## Pasos para conectar sky.com.pe

1. **Agregar el dominio a Cloudflare** — en el dashboard, "Websites" (menú
   izquierdo) → **Add a domain** → escribir `sky.com.pe` → Cloudflare escanea
   los registros DNS existentes (los importa automáticamente, para no perder
   nada que ya esté configurado — correo, subdominios, etc., si los hay).
2. **Revisar los registros importados** antes de seguir — confirmar que no
   falte nada importante (por ejemplo registros `MX` de correo, si usan
   `@sky.com.pe`).
3. Cloudflare te va a mostrar **2 nameservers nuevos** (algo como
   `xxxx.ns.cloudflare.com` y `yyyy.ns.cloudflare.com`).
4. **Cambiar los nameservers** del dominio donde esté registrado (hay que
   entrar al panel de Soluciones Web Perú, o donde se haya comprado
   originalmente el `.pe`, y buscar la sección de "Nameservers"/"Servidores
   de nombres" del dominio) — reemplazar los actuales
   (`ns1/ns2.solucioneswebperu.com`) por los 2 que dio Cloudflare.
5. **Esperar la propagación** — Cloudflare avisa por correo cuando el
   dominio queda activo en su red (puede tardar desde minutos hasta un día,
   a veces más con dominios `.pe`).
6. Una vez el dominio esté "Active" en Cloudflare: ir al proyecto
   **Workers & Pages → sky-group-web → Settings → Domains** → **Add
   Custom Domain** → escribir `sky.com.pe` (y repetir para `www.sky.com.pe`
   si se quiere que ambas formas funcionen).
7. Cloudflare emite el certificado SSL automáticamente — no hay que subir
   ni comprar nada.
8. Verificar entrando a `https://sky.com.pe` y `https://www.sky.com.pe` en
   una ventana de incógnito.

## Después de conectar el dominio

- Confirmar que `astro.config.mjs` siga teniendo `site: 'https://sky.com.pe'`
  (ya está así) — es lo que usa el sitemap y las URLs canónicas.
- Si se quiere que una de las dos formas (`sky.com.pe` o `www.sky.com.pe`)
  redirija a la otra, se configura con una regla de "Redirect Rules" en el
  dashboard de Cloudflare (gratis, sin código).
