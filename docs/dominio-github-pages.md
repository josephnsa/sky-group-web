# Conectar sky.com.pe a GitHub Pages

Guía para cuando agregues los registros DNS en el panel de Soluciones Web
Perú y quede andando `https://sky.com.pe`.

## Situación actual (verificada 2026-09-07)

- El hosting es **GitHub Pages** (no Cloudflare — se migró por decisión
  explícita: los dueños del sitio no quieren tocar los nameservers del
  dominio bajo ninguna circunstancia, y GitHub Pages funciona con simples
  registros A/CNAME en el panel de DNS que ya usan, sin migrar nada).
- Deploy automático: cada `git push` a `master` dispara el workflow
  `.github/workflows/deploy.yml` (build + publicación), sin pasos manuales.
- URL temporal (mientras no esté el dominio conectado):
  `https://josephnsa.github.io/sky-group-web/` — **las imágenes/estilos se
  van a ver rotos ahí a propósito**: el sitio está armado para vivir en la
  raíz de `sky.com.pe` (rutas como `/images/...`), no en una subcarpeta.
  No es un bug, se soluciona solo apenas el dominio esté conectado.
- El dominio ya quedó configurado del lado de GitHub (`gh api ... pages`,
  campo `cname: sky.com.pe`) — falta únicamente el paso 1 de abajo, que le
  toca a quien administre el DNS actual del dominio.

## Paso único: agregar estos registros en el panel de Soluciones Web Perú

**No hace falta cambiar nameservers ni "mudar" el dominio a ningún lado** —
solo entrar al panel de DNS que ya usan (donde hoy están los registros que
apuntan a `50.31.166.23`) y agregar/reemplazar:

| Tipo  | Nombre/Host | Valor                     |
|-------|-------------|---------------------------|
| A     | @ (raíz)    | `185.199.108.153`         |
| A     | @ (raíz)    | `185.199.109.153`         |
| A     | @ (raíz)    | `185.199.110.153`         |
| A     | @ (raíz)    | `185.199.111.153`         |
| CNAME | www         | `josephnsa.github.io`     |

(los 4 registros A son los oficiales de GitHub Pages, verificados en su
documentación — hay que cargar los 4, no solo uno).

Si el dominio raíz (`sky.com.pe`, sin `www`) ya tiene otros registros A
apuntando a `50.31.166.23` (el sitio actual), esos se **reemplazan** por
los 4 de arriba — dejar ambos a la vez causaría conflictos.

## Después de agregar los registros

1. Esperar la propagación de DNS (minutos a un día, a veces más con `.pe`).
2. GitHub detecta el dominio automáticamente y emite el certificado HTTPS
   solo — no hay que hacer nada más de nuestro lado.
3. Verificar entrando a `https://sky.com.pe` y `https://www.sky.com.pe` en
   una ventana de incógnito.
4. Si después de 24-48h sigue sin andar: revisar en GitHub
   (Settings → Pages del repo `sky-group-web`) si marca algún error de
   verificación del dominio.

## Nota: Cloudflare quedó configurado en paralelo, funcionando

Antes de esta decisión se había dejado el sitio funcionando en Cloudflare
Workers (`https://sky-group-web.salazar-atalayaj.workers.dev`, ver
`docs/dominio-cloudflare.md`) — sigue ahí, activo y gratis, por si en algún
momento se quiere retomar esa vía (esa sí requeriría mover los nameservers,
que es justo lo que se quiso evitar). No hace falta borrar nada de
Cloudflare para que GitHub Pages funcione — son independientes.
