# Libro de Reclamaciones Virtual

El formulario de `/libro-de-reclamaciones` guarda los reclamos directamente en
Supabase (tabla `reclamos`) — no depende de ningún servicio externo (Google
Apps Script, correo, etc.).

## Cómo funciona (y qué exige realmente la ley)

Por la Ley N° 29571 y el D.S. N° 011-2011-PCM, el negocio tiene que:

1. Dejar que el consumidor registre un reclamo o queja con los datos obligatorios.
2. Entregarle un **código de seguimiento** en el momento.
3. Responderle dentro del plazo (30 días, norma general de protección al consumidor).

**No hay ninguna obligación de avisar a INDECOPI ni a otra entidad al momento
del registro** — eso solo pasa después, y por iniciativa propia del cliente,
si no queda conforme con la respuesta del negocio. Por eso alcanza con
guardar el reclamo en una base de datos propia (Supabase, en este caso).

## Configuración (una sola vez)

Correr `docs/migracion-reclamos-supabase.sql` en el SQL Editor de Supabase —
crea la tabla `reclamos` con sus permisos (cualquiera puede registrar un
reclamo; solo un admin puede verlos y marcarlos como atendidos).

## Uso

- El formulario público (`/libro-de-reclamaciones`) siempre está activo, no
  hay ningún paso de configuración pendiente del lado del código.
- Los reclamos se revisan en **`/admin/reclamos`** — se pueden ver todos los
  detalles y marcar cada uno como "Atendido" una vez resuelto.
- No hay aviso automático por correo cuando llega un reclamo nuevo — hay que
  entrar al panel a revisar. Si más adelante se quiere un aviso automático,
  se puede agregar con un servicio de correo transaccional (tiene un costo o
  configuración extra, no es tan directo como con una cuenta de Gmail).
