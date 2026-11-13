-- Reestructura el catálogo a las 11 categorías del Excel del cliente
-- ("PAG WEB SKY/CATEGORIA PRODUCTOS.xlsx"), con sus subcategorías y un tercer
-- nivel nuevo, "tipo de producto" (columna "PRODUCTOS (SUB SUB)" del Excel).
--
-- Generado automáticamente. Todo corre en una transacción: si algo falla,
-- no se aplica nada. Para volver atrás: docs/rollback-categorias-excel.sql
--
-- Resguardos:
-- * Las categorías viejas solo se borran si ya no tienen productos (la
--   clave foránea productos -> categorias es "on delete restrict", así que
--   la base tampoco lo permitiría).
-- * Las subcategorías viejas solo se borran si ningún producto las usa
--   (por ejemplo, un producto cargado desde el admin después de generar
--   este script conserva la suya).
-- * Las fotos de categoría cargadas desde el admin no se pisan.

begin;

-- 1) Tercer nivel: tipos de producto -----------------------------------------
create table if not exists tipos_producto (
  id uuid primary key default gen_random_uuid(),
  categoria_slug text not null references categorias(slug) on delete cascade,
  subcategoria text not null,
  nombre text not null,
  orden int not null default 0,
  unique (categoria_slug, subcategoria, nombre)
);
alter table tipos_producto enable row level security;
drop policy if exists "lectura pública de tipos_producto" on tipos_producto;
create policy "lectura pública de tipos_producto" on tipos_producto for select using (true);
drop policy if exists "admins escriben tipos_producto" on tipos_producto;
create policy "admins escriben tipos_producto" on tipos_producto
  for all using (public.es_admin()) with check (public.es_admin());

alter table productos add column if not exists tipo text;

-- Ficha técnica descargable en PDF por producto (la pide la ficha de
-- SK-CPL88-BL); se sube desde el admin.
alter table productos add column if not exists ficha_tecnica_url text;

-- 2) Las 11 categorías del Excel ---------------------------------------------
insert into categorias (slug, nombre, foto_url, orden, activo) values
('equipamiento-exterior', 'Equipamiento Exterior', '/images/categorias/equipamiento-exterior.webp', 0, true),
('iluminacion', 'Iluminación', '/images/categorias/iluminacion.webp', 1, true),
('interior-y-confort', 'Interior y Confort', '/images/categorias/interior-y-confort.webp', 2, true),
('accesorios-electricos', 'Accesorios Eléctricos', null, 3, true),
('seguridad-auxilio-y-remolque', 'Seguridad, Auxilio y Remolque', '/images/categorias/seguridad-auxilio-y-remolque.webp', 4, true),
('cuidado-y-limpieza', 'Cuidado y Limpieza', '/images/categorias/cuidado-y-limpieza.webp', 5, true),
('tuning-y-personalizacion', 'Tuning y Personalización', '/images/categorias/tuning-y-personalizacion.webp', 6, true),
('repuestos-y-mas', 'Repuestos y Más', null, 7, true),
('herramientas', 'Herramientas', '/images/categorias/herramientas.webp', 8, true),
('accesorios-para-motos', 'Accesorios para Motos', null, 9, true),
('accesorios-para-camiones', 'Accesorios para Camiones', null, 10, true)
on conflict (slug) do update set
  nombre = excluded.nombre,
  orden = excluded.orden,
  activo = true,
  foto_url = coalesce(categorias.foto_url, excluded.foto_url);

-- 3) Reubicación de los productos --------------------------------------------
update productos set categoria_slug = 'cuidado-y-limpieza', subcategoria = 'Cobertores', tipo = 'Cobertores para Auto' where sku = 'INT-002';
update productos set categoria_slug = 'cuidado-y-limpieza', subcategoria = 'Fijación y Adhesivos', tipo = 'Cinta Antideslizante' where sku = 'CIN-002';
update productos set categoria_slug = 'cuidado-y-limpieza', subcategoria = 'Limpieza y Cuidado', tipo = 'Pulidor Recargable Multifunción' where sku = 'LIM-001';
update productos set categoria_slug = 'cuidado-y-limpieza', subcategoria = 'Limpieza y Cuidado', tipo = 'Pistola de Limpieza' where sku = 'LIM-002';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Molduras y Protección', tipo = 'Molduras Laterales' where sku = 'SD-RV24-BKC';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Viajes y Aventura', tipo = 'Parrillas' where sku = 'EXT-001';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Viajes y Aventura', tipo = 'Barras Transversales' where sku = 'EXT-002';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Viajes y Aventura', tipo = 'Porta Bicicletas' where sku = 'EXT-003';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Viajes y Aventura', tipo = 'Porta Bicicletas' where sku = 'LR-BC04';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Viajes y Aventura', tipo = 'Porta Bicicletas' where sku = 'LR-BC05';
update productos set categoria_slug = 'herramientas', subcategoria = 'Equipamiento de Taller', tipo = 'Carrito Porta Herramientas' where sku = 'TRA-001';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED Auxiliares', tipo = 'Barras LED' where sku = 'ILU-002';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED Tipo OEM', tipo = 'Neblineros OEM' where sku = 'FL-RA21';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED Tipo OEM', tipo = 'DRL y Reflectores' where sku = 'RL-CC21';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Iluminación Decorativa', tipo = 'Luces de Salón' where sku = 'ILU-003';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Iluminación Decorativa', tipo = 'Luces de Malla' where sku = 'SK-LL04-RB';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Iluminación Decorativa', tipo = 'Luces de Malla' where sku = 'SK-LL04-WH';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Línea TACPRO', tipo = 'Faros y Focos LED TACPRO' where sku = 'ILU-001';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Señalización y Emergencia', tipo = 'Circulinas de Emergencia' where sku = 'SK-CPL88-BL';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Confort y Cuidado Interior', tipo = 'Respaldar Tipo Frescos' where sku = 'SK-JRRL01-BL';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Confort y Cuidado Interior', tipo = 'Respaldar Tipo Frescos' where sku = 'SK-JRRL01-GR';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Confort y Cuidado Interior', tipo = 'Respaldar Ortopédico' where sku = 'SK-RETH01';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Confort y Cuidado Interior', tipo = 'Respaldar Ortopédico' where sku = 'SK-RETH02';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Cubre Volantes', tipo = 'Cubre Volantes PU' where sku = 'INT-001';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Organización y Practicidad', tipo = 'Organizador de Maletera' where sku = 'SK-KFOZ02-BK';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Tecnología', tipo = 'Sistemas de Seguridad' where sku = 'SK-DWKEY1-C';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Auxilio Vehicular', tipo = null where sku = 'AUX-001';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Auxilio Vehicular', tipo = 'Gatas' where sku = 'AUX-002';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Auxilio Vehicular', tipo = 'Compresoras de Aire' where sku = 'AUX-003';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Auxilio Vehicular', tipo = 'Cables para Batería' where sku = 'AUX-004';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Auxilio Vehicular', tipo = 'Linternas y Lámparas LED' where sku = 'TRA-002';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Remolque', tipo = 'Fajas y Eslingas de Remolque' where sku = 'REM-001';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Remolque', tipo = 'Bola de Remolque' where sku = 'REM-002';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Remolque', tipo = 'Fajas y Eslingas de Remolque' where sku = 'SK-SS8TON';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Remolque', tipo = 'Fajas y Eslingas de Remolque' where sku = 'SK-TP005';
update productos set categoria_slug = 'seguridad-auxilio-y-remolque', subcategoria = 'Seguridad y Antirrobo', tipo = 'Seguro de Ruedas' where sku = 'SEG-001';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Decoración', tipo = 'Seguros y Tuercas Deportivas' where sku = 'SEG-002';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Decoración', tipo = 'Porta Placas LED' where sku = 'TUN-001';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Decoración', tipo = 'Llaveros' where sku = 'TUN-003';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Extintores', tipo = 'Extintores Deportivos' where sku = 'TUN-002';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Molduras', tipo = 'Pisaderas' where sku = 'MOL-001';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Molduras', tipo = 'Topes de Puerta' where sku = 'MOL-002';
update productos set categoria_slug = 'tuning-y-personalizacion', subcategoria = 'Vinil y Láminas', tipo = 'Cinta Carbon 5D' where sku = 'CIN-001';

-- 3b) Productos sin foto propia que cambian de categoría: conservan la foto
-- que muestran hoy (la de su categoría anterior) en vez de heredar otra.
update productos set imagen = '/images/categorias/remolque.webp' where sku = 'REM-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp' where sku = 'TUN-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/auxilio-vehicular.webp' where sku = 'AUX-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/auxilio-vehicular.webp' where sku = 'AUX-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/auxilio-vehicular.webp' where sku = 'AUX-003' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/auxilio-vehicular.webp' where sku = 'AUX-004' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/mantenimiento-y-herramientas.webp' where sku = 'CIN-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/mantenimiento-y-herramientas.webp' where sku = 'CIN-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/interior-y-confort.webp' where sku = 'INT-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/mantenimiento-y-herramientas.webp' where sku = 'LIM-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/mantenimiento-y-herramientas.webp' where sku = 'LIM-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/molduras-y-protectores.webp' where sku = 'MOL-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/molduras-y-protectores.webp' where sku = 'MOL-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/remolque.webp' where sku = 'REM-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/seguros.webp' where sku = 'SEG-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/seguros.webp' where sku = 'SEG-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/para-trabajo-y-negocio.webp' where sku = 'TRA-001' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/para-trabajo-y-negocio.webp' where sku = 'TRA-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp' where sku = 'TUN-002' and (imagen is null or imagen = '' or imagen like '%placeholder%');
update productos set imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp' where sku = 'TUN-003' and (imagen is null or imagen = '' or imagen like '%placeholder%');

-- 4) Subcategorías del Excel (y limpieza de las viejas sin productos) --------
delete from subcategorias s
where not exists (
  select 1 from productos p where p.categoria_slug = s.categoria_slug and p.subcategoria = s.nombre
);
insert into subcategorias (categoria_slug, nombre, orden) values
('equipamiento-exterior', 'Viajes y Aventura', 0),
('equipamiento-exterior', 'Estribos', 1),
('equipamiento-exterior', 'Off Road', 2),
('equipamiento-exterior', 'Equipamiento 4x4', 3),
('equipamiento-exterior', 'Molduras y Protección', 4),
('equipamiento-exterior', 'Modificaciones y Upgrade', 5),
('iluminacion', 'Línea TACPRO', 0),
('iluminacion', 'Faros LED Tipo OEM', 1),
('iluminacion', 'Faros LED Auxiliares', 2),
('iluminacion', 'Iluminación Decorativa', 3),
('iluminacion', 'Señalización y Emergencia', 4),
('iluminacion', 'Focos LED', 5),
('iluminacion', 'Accesorios de Iluminación', 6),
('interior-y-confort', 'Cubre Volantes', 0),
('interior-y-confort', 'Confort y Cuidado Interior', 1),
('interior-y-confort', 'Organización y Practicidad', 2),
('interior-y-confort', 'Tecnología', 3),
('interior-y-confort', 'Audio y Video', 4),
('interior-y-confort', 'Ventiladores y Calefacción', 5),
('accesorios-electricos', 'Transformadores', 0),
('accesorios-electricos', 'Conectores y Terminales', 1),
('accesorios-electricos', 'Fusibles y Relays', 2),
('accesorios-electricos', 'Switches', 3),
('accesorios-electricos', 'Cables', 4),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 0),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 1),
('seguridad-auxilio-y-remolque', 'Remolque', 2),
('cuidado-y-limpieza', 'Limpieza y Cuidado', 0),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 1),
('cuidado-y-limpieza', 'Cobertores', 2),
('cuidado-y-limpieza', 'Tapasoles', 3),
('tuning-y-personalizacion', 'Vinil y Láminas', 0),
('tuning-y-personalizacion', 'Stickers', 1),
('tuning-y-personalizacion', 'Decoración', 2),
('tuning-y-personalizacion', 'Filtros y Tomas de Aire', 3),
('tuning-y-personalizacion', 'Extintores', 4),
('tuning-y-personalizacion', 'Remolques', 5),
('tuning-y-personalizacion', 'Luces LED Tuning', 6),
('tuning-y-personalizacion', 'Molduras', 7),
('tuning-y-personalizacion', 'Pedales y Perillas', 8),
('tuning-y-personalizacion', 'Tapas de Rueda', 9),
('tuning-y-personalizacion', 'Tubos de Escape', 10),
('repuestos-y-mas', 'Espejos', 0),
('repuestos-y-mas', 'Antenas', 1),
('repuestos-y-mas', 'Claxon y Sirenas', 2),
('repuestos-y-mas', 'Plumillas', 3),
('repuestos-y-mas', 'Repuestos para Interior', 4),
('repuestos-y-mas', 'Tapas de Combustible y Aceite', 5),
('repuestos-y-mas', 'Bota Aguas', 6),
('herramientas', 'Equipamiento de Taller', 0),
('herramientas', 'Fijación y Adhesivos', 1),
('herramientas', 'Herramientas Eléctricas', 2),
('herramientas', 'Porta Celular', 3),
('accesorios-para-motos', 'Faros LED Moto', 0),
('accesorios-para-motos', 'Focos LED Moto', 1),
('accesorios-para-motos', 'Seguros de Moto', 2),
('accesorios-para-motos', 'Cobertores de Moto', 3),
('accesorios-para-motos', 'Mallas para Casco', 4),
('accesorios-para-motos', 'Luces LED Moto', 5),
('accesorios-para-motos', 'Ojos LED Moto', 6),
('accesorios-para-motos', 'Botón de Arranque Moto', 7),
('accesorios-para-motos', 'Espejos', 8),
('accesorios-para-motos', 'Soportes para Neblineros', 9),
('accesorios-para-motos', 'Tapas de Rueda Moto', 10),
('accesorios-para-camiones', 'Faros Laterales', 0),
('accesorios-para-camiones', 'Claxon', 1),
('accesorios-para-camiones', 'Circulinas', 2),
('accesorios-para-camiones', 'Ventiladores', 3),
('accesorios-para-camiones', 'Tiras LED', 4),
('accesorios-para-camiones', 'Encendedores', 5),
('accesorios-para-camiones', 'Transformadores', 6),
('accesorios-para-camiones', 'Cubre Volantes', 7),
('accesorios-para-camiones', 'Medidores', 8),
('accesorios-para-camiones', 'Barras LED', 9),
('accesorios-para-camiones', 'Faros LED', 10),
('accesorios-para-camiones', 'Sirenas de Retroceso', 11),
('accesorios-para-camiones', 'Adaptadores Olesson', 12)
on conflict (categoria_slug, nombre) do update set orden = excluded.orden;

-- 5) Tipos de producto del Excel ---------------------------------------------
insert into tipos_producto (categoria_slug, subcategoria, nombre, orden) values
('equipamiento-exterior', 'Viajes y Aventura', 'Barras Laterales', 0),
('equipamiento-exterior', 'Viajes y Aventura', 'Barras Transversales', 1),
('equipamiento-exterior', 'Viajes y Aventura', 'Parrillas', 2),
('equipamiento-exterior', 'Viajes y Aventura', 'Porta Equipajes', 3),
('equipamiento-exterior', 'Viajes y Aventura', 'Porta Bicicletas', 4),
('equipamiento-exterior', 'Viajes y Aventura', 'Remolques OEM', 5),
('equipamiento-exterior', 'Viajes y Aventura', 'Accesorios para Viaje', 6),
('equipamiento-exterior', 'Estribos', 'Estribos Tipo OEM', 0),
('equipamiento-exterior', 'Estribos', 'Estribos Universales', 1),
('equipamiento-exterior', 'Off Road', 'Antivuelcos Off Road', 0),
('equipamiento-exterior', 'Off Road', 'Bumpers Delanteros', 1),
('equipamiento-exterior', 'Off Road', 'Bumpers Posteriores', 2),
('equipamiento-exterior', 'Off Road', 'Estribos Off Road', 3),
('equipamiento-exterior', 'Off Road', 'Remolques OEM', 4),
('equipamiento-exterior', 'Off Road', 'Canopys', 5),
('equipamiento-exterior', 'Off Road', 'Racks', 6),
('equipamiento-exterior', 'Equipamiento 4x4', 'Antivuelcos', 0),
('equipamiento-exterior', 'Equipamiento 4x4', 'Defensas Delanteras', 1),
('equipamiento-exterior', 'Equipamiento 4x4', 'Defensas Posteriores', 2),
('equipamiento-exterior', 'Equipamiento 4x4', 'Snorkels', 3),
('equipamiento-exterior', 'Equipamiento 4x4', 'Fenders y Guardafangos', 4),
('equipamiento-exterior', 'Equipamiento 4x4', 'Protectores para Cárter', 5),
('equipamiento-exterior', 'Equipamiento 4x4', 'Lonas Marítimas', 6),
('equipamiento-exterior', 'Equipamiento 4x4', 'Cubiertas Rígidas para Tolvas', 7),
('equipamiento-exterior', 'Equipamiento 4x4', 'Accesorios y Más', 8),
('equipamiento-exterior', 'Molduras y Protección', 'Accesorios Decorativos', 0),
('equipamiento-exterior', 'Molduras y Protección', 'Corre Lluvias', 1),
('equipamiento-exterior', 'Molduras y Protección', 'Molduras y Deflectores de Capot', 2),
('equipamiento-exterior', 'Molduras y Protección', 'Molduras de Techo', 3),
('equipamiento-exterior', 'Molduras y Protección', 'Molduras Laterales', 4),
('equipamiento-exterior', 'Molduras y Protección', 'Molduras Posteriores', 5),
('equipamiento-exterior', 'Molduras y Protección', 'Kit Protectores OEM', 6),
('equipamiento-exterior', 'Molduras y Protección', 'Protección Interior', 7),
('equipamiento-exterior', 'Molduras y Protección', 'Pisos Tipo OEM', 8),
('equipamiento-exterior', 'Molduras y Protección', 'Spoilers', 9),
('equipamiento-exterior', 'Modificaciones y Upgrade', 'Defensas ABS', 0),
('equipamiento-exterior', 'Modificaciones y Upgrade', 'Mallas Delanteras', 1),
('equipamiento-exterior', 'Modificaciones y Upgrade', 'Kit de Conversiones', 2),
('equipamiento-exterior', 'Modificaciones y Upgrade', 'Patines ABS', 3),
('iluminacion', 'Línea TACPRO', 'Faros y Focos LED TACPRO', 0),
('iluminacion', 'Faros LED Tipo OEM', 'Neblineros OEM', 0),
('iluminacion', 'Faros LED Tipo OEM', 'Faros Delanteros y Posteriores', 1),
('iluminacion', 'Faros LED Tipo OEM', 'DRL y Reflectores', 2),
('iluminacion', 'Faros LED Auxiliares', 'Barras LED', 0),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED Empotrables', 1),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED Láser', 2),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED Dual', 3),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED Force', 4),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED para Motos', 5),
('iluminacion', 'Faros LED Auxiliares', 'Faros LED Varios', 6),
('iluminacion', 'Iluminación Decorativa', 'LED Tuning', 0),
('iluminacion', 'Iluminación Decorativa', 'Luces Decorativas', 1),
('iluminacion', 'Iluminación Decorativa', 'Luces de Malla', 2),
('iluminacion', 'Iluminación Decorativa', 'Luces de Salón', 3),
('iluminacion', 'Iluminación Decorativa', 'Cintas y Tiras LED', 4),
('iluminacion', 'Señalización y Emergencia', 'Circulinas', 0),
('iluminacion', 'Señalización y Emergencia', 'Circulinas de Emergencia', 1),
('iluminacion', 'Señalización y Emergencia', 'Faros de Posición', 2),
('iluminacion', 'Señalización y Emergencia', 'Luces de Freno', 3),
('iluminacion', 'Focos LED', 'Focos LED Principales', 0),
('iluminacion', 'Focos LED', 'Foco LED T10', 1),
('iluminacion', 'Focos LED', 'Foco LED T20', 2),
('iluminacion', 'Focos LED', 'Foco LED 1 Contacto', 3),
('iluminacion', 'Focos LED', 'Foco LED 2 Contactos', 4),
('iluminacion', 'Focos LED', 'Foco LED de Salón', 5),
('iluminacion', 'Focos LED', 'CAN BUS', 6),
('iluminacion', 'Accesorios de Iluminación', 'Controles Remotos para Faros', 0),
('iluminacion', 'Accesorios de Iluminación', 'Porta Faros de Capot', 1),
('iluminacion', 'Accesorios de Iluminación', 'Porta Faros de Placa', 2),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes Cuero', 0),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes PU', 1),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes Látex', 2),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes Tipo D', 3),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes Chinchón', 4),
('interior-y-confort', 'Cubre Volantes', 'Cubre Volantes Reflectivos', 5),
('interior-y-confort', 'Confort y Cuidado Interior', 'Respaldar Lumbar', 0),
('interior-y-confort', 'Confort y Cuidado Interior', 'Respaldar Ortopédico', 1),
('interior-y-confort', 'Confort y Cuidado Interior', 'Respaldar Tipo Frescos', 2),
('interior-y-confort', 'Confort y Cuidado Interior', 'Respaldares Delux', 3),
('interior-y-confort', 'Confort y Cuidado Interior', 'Cojines con Respaldar', 4),
('interior-y-confort', 'Confort y Cuidado Interior', 'Respaldar Bolitas', 5),
('interior-y-confort', 'Confort y Cuidado Interior', 'Cojines de Asiento', 6),
('interior-y-confort', 'Confort y Cuidado Interior', 'Fundas de Asiento', 7),
('interior-y-confort', 'Confort y Cuidado Interior', 'Pisos de Jebe', 8),
('interior-y-confort', 'Confort y Cuidado Interior', 'Pisos Alfombrados', 9),
('interior-y-confort', 'Confort y Cuidado Interior', 'Pisos de Maletera', 10),
('interior-y-confort', 'Organización y Practicidad', 'Porta Celulares', 0),
('interior-y-confort', 'Organización y Practicidad', 'Porta Vasos', 1),
('interior-y-confort', 'Organización y Practicidad', 'Porta Lentes', 2),
('interior-y-confort', 'Organización y Practicidad', 'Ganchos para Cabecera', 3),
('interior-y-confort', 'Organización y Practicidad', 'Mini Ganchos para Cables', 4),
('interior-y-confort', 'Organización y Practicidad', 'Organizador de Maletera', 5),
('interior-y-confort', 'Tecnología', 'Accesorios para Celular', 0),
('interior-y-confort', 'Tecnología', 'Cámaras para Retroceso', 1),
('interior-y-confort', 'Tecnología', 'Sistemas para Retroceso', 2),
('interior-y-confort', 'Tecnología', 'Sistemas de Seguridad', 3),
('interior-y-confort', 'Tecnología', 'Dash Cams', 4),
('interior-y-confort', 'Tecnología', 'Pantallas y Más', 5),
('interior-y-confort', 'Audio y Video', 'Autoradios con Bluetooth', 0),
('interior-y-confort', 'Audio y Video', 'Autoradios con Pantalla', 1),
('interior-y-confort', 'Audio y Video', 'Tweeters', 2),
('interior-y-confort', 'Audio y Video', 'Inversores', 3),
('interior-y-confort', 'Audio y Video', 'Accesorios y Más', 4),
('interior-y-confort', 'Ventiladores y Calefacción', 'Ventiladores de 12V', 0),
('interior-y-confort', 'Ventiladores y Calefacción', 'Ventiladores de 24V', 1),
('interior-y-confort', 'Ventiladores y Calefacción', 'Ventiladores USB', 2),
('interior-y-confort', 'Ventiladores y Calefacción', 'Calefactores', 3),
('accesorios-electricos', 'Transformadores', 'Inversor de Voltaje', 0),
('accesorios-electricos', 'Transformadores', 'Convertidor de Voltaje', 1),
('accesorios-electricos', 'Transformadores', 'Transformador', 2),
('accesorios-electricos', 'Conectores y Terminales', 'Conectores para Batería', 0),
('accesorios-electricos', 'Conectores y Terminales', 'Terminales', 1),
('accesorios-electricos', 'Conectores y Terminales', 'Conectores para Cables', 2),
('accesorios-electricos', 'Conectores y Terminales', 'Sockets', 3),
('accesorios-electricos', 'Fusibles y Relays', 'Fusibles y Mini Fusibles de Uña', 0),
('accesorios-electricos', 'Fusibles y Relays', 'Porta Fusibles', 1),
('accesorios-electricos', 'Fusibles y Relays', 'Relays', 2),
('accesorios-electricos', 'Fusibles y Relays', 'Porta Relays', 3),
('accesorios-electricos', 'Switches', 'Switches para Luz', 0),
('accesorios-electricos', 'Switches', 'Switches Alza Lunas', 1),
('accesorios-electricos', 'Switches', 'Switches de Puerta', 2),
('accesorios-electricos', 'Switches', 'Botón para Claxon y Pulsadores', 3),
('accesorios-electricos', 'Switches', 'Mandos y Más', 4),
('accesorios-electricos', 'Cables', 'Cable Automotriz', 0),
('accesorios-electricos', 'Cables', 'Cable Automotriz Vulcanizado', 1),
('accesorios-electricos', 'Cables', 'Cable para Parlante', 2),
('accesorios-electricos', 'Cables', 'Protector para Cables', 3),
('accesorios-electricos', 'Cables', 'Mangas Termocontraíbles', 4),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Cinturones de Seguridad', 0),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Cerraduras para Puerta', 1),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Seguros de Parachoques', 2),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Seguros para Moto', 3),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Seguro para Timón', 4),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Seguro para Pedal', 5),
('seguridad-auxilio-y-remolque', 'Seguridad y Antirrobo', 'Seguro de Ruedas', 6),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Cables para Batería', 0),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Conos y Triángulos de Seguridad', 1),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Compresoras de Aire', 2),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Linternas y Lámparas LED', 3),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Medidores de Aire', 4),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Kit de Reparación de Llanta', 5),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Gatas', 6),
('seguridad-auxilio-y-remolque', 'Auxilio Vehicular', 'Llaves de Rueda', 7),
('seguridad-auxilio-y-remolque', 'Remolque', 'Acople de Remolque', 0),
('seguridad-auxilio-y-remolque', 'Remolque', 'Bola de Remolque', 1),
('seguridad-auxilio-y-remolque', 'Remolque', 'Cables de Remolque', 2),
('seguridad-auxilio-y-remolque', 'Remolque', 'Fajas y Eslingas de Remolque', 3),
('seguridad-auxilio-y-remolque', 'Remolque', 'Ganchos de Remolque', 4),
('seguridad-auxilio-y-remolque', 'Remolque', 'Perillas de Remolque', 5),
('cuidado-y-limpieza', 'Limpieza y Cuidado', 'Aspiradores', 0),
('cuidado-y-limpieza', 'Limpieza y Cuidado', 'Pulidor Recargable Multifunción', 1),
('cuidado-y-limpieza', 'Limpieza y Cuidado', 'Pistola de Limpieza', 2),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 'Cintillos de Nylon', 0),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 'Cinta Doble Contacto', 1),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 'Cinta Adhesiva Detalle Carbon', 2),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 'Cinta Antideslizante', 3),
('cuidado-y-limpieza', 'Fijación y Adhesivos', 'Pines de Tapiz', 4),
('cuidado-y-limpieza', 'Cobertores', 'Cobertores para Auto', 0),
('cuidado-y-limpieza', 'Cobertores', 'Cobertores para Camioneta', 1),
('cuidado-y-limpieza', 'Cobertores', 'Cobertores para Moto', 2),
('cuidado-y-limpieza', 'Tapasoles', 'Tapasol Tipo Paraguas', 0),
('cuidado-y-limpieza', 'Tapasoles', 'Tapasol Corredizo', 1),
('cuidado-y-limpieza', 'Tapasoles', 'Tapasol de Malla', 2),
('cuidado-y-limpieza', 'Tapasoles', 'Tapasol Plateado', 3),
('tuning-y-personalizacion', 'Vinil y Láminas', 'Vinil con Liner y Transparente', 0),
('tuning-y-personalizacion', 'Vinil y Láminas', 'Vinil Panorámico', 1),
('tuning-y-personalizacion', 'Vinil y Láminas', 'Vinil Fibra de Carbono', 2),
('tuning-y-personalizacion', 'Vinil y Láminas', 'Cinta Carbon 5D', 3),
('tuning-y-personalizacion', 'Vinil y Láminas', 'Set de Espátulas', 4),
('tuning-y-personalizacion', 'Stickers', 'Stickers ABS 3D', 0),
('tuning-y-personalizacion', 'Stickers', 'Stickers ABS Alto Relieve', 1),
('tuning-y-personalizacion', 'Stickers', 'Stickers Metálicos', 2),
('tuning-y-personalizacion', 'Stickers', 'Stickers Laterales Metálicos', 3),
('tuning-y-personalizacion', 'Decoración', 'Llaveros', 0),
('tuning-y-personalizacion', 'Decoración', 'Adornos Colgantes', 1),
('tuning-y-personalizacion', 'Decoración', 'Tapas de Válvula', 2),
('tuning-y-personalizacion', 'Decoración', 'Porta Placas ABS', 3),
('tuning-y-personalizacion', 'Decoración', 'Porta Placas LED', 4),
('tuning-y-personalizacion', 'Decoración', 'Porta Placas Metálicas', 5),
('tuning-y-personalizacion', 'Decoración', 'Seguros y Ganchos de Parachoques', 6),
('tuning-y-personalizacion', 'Decoración', 'Seguros y Tuercas Deportivas', 7),
('tuning-y-personalizacion', 'Decoración', 'Antenas Decorativas', 8),
('tuning-y-personalizacion', 'Filtros y Tomas de Aire', 'Filtros de Aire', 0),
('tuning-y-personalizacion', 'Filtros y Tomas de Aire', 'Tubos Flexibles para Toma de Aire', 1),
('tuning-y-personalizacion', 'Filtros y Tomas de Aire', 'Tomas de Aire', 2),
('tuning-y-personalizacion', 'Extintores', 'Extintores Deportivos', 0),
('tuning-y-personalizacion', 'Remolques', 'Ganchos de Remolque', 0),
('tuning-y-personalizacion', 'Remolques', 'Ganchos Decorativos', 1),
('tuning-y-personalizacion', 'Luces LED Tuning', 'Tuning de Faros', 0),
('tuning-y-personalizacion', 'Luces LED Tuning', 'Tuning Exterior', 1),
('tuning-y-personalizacion', 'Luces LED Tuning', 'Tuning Interior', 2),
('tuning-y-personalizacion', 'Molduras', 'Lips Delanteros y Posteriores', 0),
('tuning-y-personalizacion', 'Molduras', 'Spoilers', 1),
('tuning-y-personalizacion', 'Molduras', 'Protectores de Puerta', 2),
('tuning-y-personalizacion', 'Molduras', 'Protectores de Manijas', 3),
('tuning-y-personalizacion', 'Molduras', 'Protectores de Parachoques', 4),
('tuning-y-personalizacion', 'Molduras', 'Pisaderas', 5),
('tuning-y-personalizacion', 'Molduras', 'Topes de Puerta', 6),
('tuning-y-personalizacion', 'Molduras', 'Filetes', 7),
('tuning-y-personalizacion', 'Molduras', 'Malla ABS para Parachoques', 8),
('tuning-y-personalizacion', 'Pedales y Perillas', 'Perillas para Timón', 0),
('tuning-y-personalizacion', 'Pedales y Perillas', 'Perillas de Cambios', 1),
('tuning-y-personalizacion', 'Pedales y Perillas', 'Pedales', 2),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 8"', 0),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 12"', 1),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 13"', 2),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 14"', 3),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 15"', 4),
('tuning-y-personalizacion', 'Tapas de Rueda', 'Aro 17"', 5),
('tuning-y-personalizacion', 'Tubos de Escape', 'Tubos de Escape', 0),
('repuestos-y-mas', 'Espejos', 'Espejos Laterales', 0),
('repuestos-y-mas', 'Espejos', 'Espejos Interiores', 1),
('repuestos-y-mas', 'Espejos', 'Espejos Punto Ciego', 2),
('repuestos-y-mas', 'Espejos', 'Espejos Tipo OEM', 3),
('repuestos-y-mas', 'Espejos', 'Espejos Decorativos', 4),
('repuestos-y-mas', 'Antenas', 'Antenas Receptoras AM / FM', 0),
('repuestos-y-mas', 'Antenas', 'Repuestos y Más', 1),
('repuestos-y-mas', 'Claxon y Sirenas', 'Claxon Platillo', 0),
('repuestos-y-mas', 'Claxon y Sirenas', 'Claxon Caracol', 1),
('repuestos-y-mas', 'Claxon y Sirenas', 'Claxon Cornetas', 2),
('repuestos-y-mas', 'Claxon y Sirenas', 'Accesorios y Más', 3),
('repuestos-y-mas', 'Claxon y Sirenas', 'Sirena de Retroceso', 4),
('repuestos-y-mas', 'Claxon y Sirenas', 'Sirena de Emergencia', 5),
('repuestos-y-mas', 'Plumillas', 'Plumillas Ergonómicas', 0),
('repuestos-y-mas', 'Plumillas', 'Plumillas OEM', 1),
('repuestos-y-mas', 'Plumillas', 'Plumillas Multiadaptador', 2),
('repuestos-y-mas', 'Plumillas', 'Plumillas Metálicas', 3),
('repuestos-y-mas', 'Plumillas', 'Brazos de Plumilla', 4),
('repuestos-y-mas', 'Repuestos para Interior', 'Encendedores', 0),
('repuestos-y-mas', 'Repuestos para Interior', 'Base de Encendedor', 1),
('repuestos-y-mas', 'Tapas de Combustible y Aceite', 'Tapas de Combustible', 0),
('repuestos-y-mas', 'Tapas de Combustible y Aceite', 'Tapas de Radiador', 1),
('repuestos-y-mas', 'Bota Aguas', 'Bota Aguas con Luz', 0),
('repuestos-y-mas', 'Bota Aguas', 'Bota Aguas OEM', 1),
('repuestos-y-mas', 'Bota Aguas', 'Tanques para Bota Aguas', 2),
('repuestos-y-mas', 'Bota Aguas', 'Motor para Bota Aguas', 3),
('herramientas', 'Equipamiento de Taller', 'Carrito Porta Herramientas', 0),
('herramientas', 'Equipamiento de Taller', 'Taburetes y Plataformas', 1),
('herramientas', 'Fijación y Adhesivos', 'Cintillos de Nylon', 0),
('herramientas', 'Fijación y Adhesivos', 'Cinta Doble Contacto', 1),
('herramientas', 'Fijación y Adhesivos', 'Cinta Antideslizante', 2),
('herramientas', 'Herramientas Eléctricas', 'Sopladoras', 0),
('herramientas', 'Herramientas Eléctricas', 'Pulidoras', 1),
('herramientas', 'Herramientas Eléctricas', 'Compresoras', 2),
('herramientas', 'Herramientas Eléctricas', 'Aspiradoras', 3),
('herramientas', 'Herramientas Eléctricas', 'Hidrolavadoras', 4),
('accesorios-para-motos', 'Luces LED Moto', 'Alas y Timón', 0)
on conflict (categoria_slug, subcategoria, nombre) do update set orden = excluded.orden;

-- 6) Categorías viejas que ya no tienen productos -----------------------------
delete from categorias c
where c.slug in ('4x4-off-road', 'accesorios-tuning-y-decoracion', 'auxilio-vehicular', 'electronica-y-tecnologia-vehicular', 'mantenimiento-y-herramientas', 'molduras-y-protectores', 'para-trabajo-y-negocio', 'remolque', 'seguros')
  and not exists (select 1 from productos p where p.categoria_slug = c.slug);

commit;
