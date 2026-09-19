-- Footer editable desde el panel de admin (punto F del plan del boceto
-- "Reunión Pag. Web"). Tabla de una sola fila (id fijo = 1) con los datos
-- que hoy están hardcodeados en src/consts.ts y se muestran en el footer
-- de todo el sitio: teléfono, correo, dirección, horario, WhatsApp, redes
-- sociales, logo y foto de fachada.
create table configuracion_sitio (
  id int primary key default 1,
  telefono text,
  correo text,
  direccion text,
  horario text,
  whatsapp_numero text,
  facebook text,
  instagram text,
  tiktok text,
  youtube text,
  logo_url text,
  foto_fachada_url text,
  constraint una_sola_fila check (id = 1)
);

alter table configuracion_sitio enable row level security;

create policy "lectura pública de configuracion_sitio" on configuracion_sitio
  for select using (true);

create policy "admins escriben configuracion_sitio" on configuracion_sitio
  for all
  using (public.es_admin())
  with check (public.es_admin());

-- Fila inicial con los valores reales ya usados en consts.ts — así el
-- formulario de admin arranca con los datos actuales en vez de vacío, y el
-- footer no pierde nada mientras nadie edita todavía.
insert into configuracion_sitio (
  id, telefono, correo, direccion, horario, whatsapp_numero,
  facebook, instagram, tiktok, youtube, logo_url, foto_fachada_url
) values (
  1,
  '+51 950 486 811',
  'administracion@sky.com.pe',
  'Av. México #1028, La Victoria, Lima, Perú',
  'Lunes a viernes 9:00am - 6:00pm, sábados 9:00am - 5:00pm',
  '51950486811',
  'https://www.facebook.com/SKYGROUPSAC',
  'https://www.instagram.com/skygroupsac/',
  'https://www.tiktok.com/@skygroupsac',
  '',
  '/images/brand/logo-blanco.png',
  '/images/nosotros/fachada.webp'
);
