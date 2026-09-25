-- Contenido editable de la nueva página /atencion-whatsapp: un video y
-- texto de atención al por mayor, editable desde /admin/configuracion.
alter table configuracion_sitio add column if not exists atencion_video_url text;
alter table configuracion_sitio add column if not exists atencion_mayorista_texto text;
