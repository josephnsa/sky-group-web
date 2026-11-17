# SKY Group · sitio web

Sitio web y catálogo de SKY Group (www.sky.com.pe), generado como sitio estático con Astro.

## Requisitos

- Node.js 22 o superior

## Variables de entorno

Crear un archivo `.env` (no se versiona) con:

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

## Comandos

| Comando           | Acción                                  |
| ----------------- | --------------------------------------- |
| `npm install`     | Instala las dependencias                |
| `npm run dev`     | Servidor local en `localhost:4321`      |
| `npm run build`   | Genera el sitio en `./dist/`            |
| `npm run preview` | Sirve localmente el sitio generado      |

La publicación se realiza automáticamente con GitHub Actions (`.github/workflows/deploy.yml`).
