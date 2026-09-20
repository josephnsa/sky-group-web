-- Amplía configuracion_sitio (ya creada antes) para que Misión, Visión,
-- Nuestra Historia, Valores (Nosotros) y la lista de Medios de pago
-- también sean editables desde /admin/configuracion, mismo patrón que el
-- resto del footer/contacto.
alter table configuracion_sitio add column if not exists mision text;
alter table configuracion_sitio add column if not exists vision text;
alter table configuracion_sitio add column if not exists historia text;
alter table configuracion_sitio add column if not exists valores jsonb; -- [{titulo, desc}]
alter table configuracion_sitio add column if not exists medios_pago jsonb; -- ["Yape", "Plin", ...]
