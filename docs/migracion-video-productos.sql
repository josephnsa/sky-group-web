-- Agrega soporte de video por producto (además de la galería de fotos,
-- `imagenes`, ya agregada antes). Con esto el panel de admin puede subir
-- varias fotos + un video por producto, como en una ficha de Amazon.
alter table productos add column if not exists video_url text;
