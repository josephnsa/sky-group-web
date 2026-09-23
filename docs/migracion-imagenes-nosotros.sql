-- Imagen opcional por sección de Nosotros (Misión, Visión, Nuestra
-- Historia), editable desde /admin/configuracion junto con su texto.
alter table configuracion_sitio add column if not exists mision_imagen text;
alter table configuracion_sitio add column if not exists vision_imagen text;
alter table configuracion_sitio add column if not exists historia_imagen text;
