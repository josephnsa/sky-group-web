-- Reemplaza el video subido como archivo por 2 enlaces de YouTube
-- editables (uno para "Atención en tienda", otro para "Atención al por
-- mayor"), embebidos en /atencion-whatsapp.
alter table configuracion_sitio add column if not exists atencion_tienda_youtube text;
alter table configuracion_sitio add column if not exists atencion_mayorista_youtube text;

update configuracion_sitio set
  atencion_tienda_youtube = 'https://www.youtube.com/watch?v=V9vEBGVuvmc',
  atencion_mayorista_youtube = 'https://www.youtube.com/watch?v=D9HPNanT_iU'
where id = 1;
