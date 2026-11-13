# Estructura de categorías del Excel del cliente

El catálogo pasa a la estructura de `PAG WEB SKY/CATEGORIA PRODUCTOS.xlsx`: **11 categorías**, **77 subcategorías** y un tercer nivel nuevo, el **tipo de producto** (columna "PRODUCTOS (SUB SUB)" del Excel, 247 tipos).

## Cómo aplicarlo

1. En Supabase → **SQL Editor**, ejecutar [`migracion-categorias-excel.sql`](migracion-categorias-excel.sql). Corre en una sola transacción: si algo falla, no se aplica nada.
2. Volver a publicar la web (un push a `master`). Las páginas del catálogo se generan al publicar.

Para volver atrás: ejecutar [`rollback-categorias-excel.sql`](rollback-categorias-excel.sql) y volver a publicar. Deja categorías, subcategorías, productos y fotos exactamente como estaban el 13/11/2026.

El código funciona con la base antes y después de la migración: se puede publicar primero y correr el SQL después.

## Qué hace la migración

| | |
|---|---|
| Categorías | Crea o actualiza las 11 del Excel. Borra las 9 anteriores solo si ya no tienen productos. |
| Productos | Reubica los 43 en su categoría, subcategoría y tipo. No toca fotos, precios, descripciones ni enlaces. |
| Fotos | Los productos sin foto propia conservan la que muestran hoy (la de su categoría anterior). |
| Subcategorías | Carga las 77 del Excel. Las anteriores se borran solo si ningún producto las usa. |
| Tipos | Crea la tabla `tipos_producto` (lectura pública, escritura solo admins) y la columna `productos.tipo`. |
| Ficha técnica | Agrega la columna `productos.ficha_tecnica_url` para el PDF descargable. |

Validado en PostgreSQL con una copia de la base real: 19 verificaciones, incluida la reversión y la idempotencia (se puede correr dos veces).

## En la web

- El menú **Categorías** muestra cada subcategoría con sus tipos debajo. Cada enlace abre el catálogo ya filtrado (`/catalogo/<categoria>?sub=…&tipo=…`).
- El catálogo tiene un filtro **Tipo de producto** cuando la subcategoría elegida tiene tipos.
- Solo se muestran las categorías, subcategorías y tipos **que tienen productos**. Las vacías (Accesorios Eléctricos, Repuestos y Más, Motos, Camiones) aparecen solas cuando se les carga su primer producto y se vuelve a publicar.
- Las URLs de las categorías anteriores redirigen a la nueva (por ejemplo `/catalogo/remolque` → `/catalogo/seguridad-auxilio-y-remolque`).
- La ficha de producto muestra la ruta Catálogo / Categoría / Subcategoría y, si hay PDF, el botón **Descargar ficha técnica (PDF)**.

## En el admin (Categorías y productos)

- Al desplegar una subcategoría aparece **Tipos de producto**: se agregan con "Agregar tipo" y se quitan con la ×.
- En el formulario de producto, **Tipo de producto** lista los tipos de la subcategoría elegida, con la opción "+ Nuevo tipo…" (se agrega a la lista al guardar).
- **Ficha técnica en PDF**: sube el PDF del producto; al editar se puede ver o quitar.
- Renombrar una subcategoría renombra también sus tipos y sus productos; borrarla borra sus tipos.
- Los precios aceptan céntimos (antes el formulario no dejaba guardar, por ejemplo, S/ 55.90).

## Correcciones de nombres respecto del Excel

Se corrigieron tildes y erratas: Extintores (ENTINTORES), Tuning Exterior/Interior (TUNIG), DRL y Reflectores (RFELECTORES), Controles Remotos (REMOTES), Taburetes y Plataformas (PALTAFORMAS), Compresoras (COMPRESOAS), Pisos Tipo OEM (EOM), Mangas Termocontraíbles (TERMOCOTRAIBLES), Accesorios Decorativos (ACCESSORIOS), Corre Lluvias (CORRELLUVIAS). En Motos, la columna de tipos traía códigos de producto (SK-FLM01, SKY-4L-M): no se cargaron como tipos.
