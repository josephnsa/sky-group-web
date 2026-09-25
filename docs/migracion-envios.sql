-- Contenido editable de la nueva página /envios (detalle de envíos: costos,
-- condiciones, envío a provincias), con hasta 2 imágenes — editable desde
-- /admin/configuracion porque el negocio lo va a ir armando.
alter table configuracion_sitio add column if not exists envios_texto text;
alter table configuracion_sitio add column if not exists envios_imagen_1 text;
alter table configuracion_sitio add column if not exists envios_imagen_2 text;
