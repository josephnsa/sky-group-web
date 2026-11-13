-- Revierte docs/migracion-categorias-excel.sql y deja las categorías,
-- subcategorías y la ubicación de cada producto exactamente como estaban
-- antes (estado leído de Supabase al generar la migración).
-- La tabla tipos_producto y la columna productos.tipo se conservan: no
-- molestan y así no se pierde lo que se haya cargado en ellas.

begin;

insert into categorias (slug, nombre, foto_url, orden, activo) values
('iluminacion', 'Iluminación', '/images/categorias/iluminacion.webp', 0, true),
('equipamiento-exterior', 'Equipamiento Exterior', '/images/categorias/equipamiento-exterior.webp', 1, true),
('4x4-off-road', '4x4 / Off Road', '/images/categorias/4x4-off-road.webp', 2, true),
('interior-y-confort', 'Interior y Confort', '/images/categorias/interior-y-confort.webp', 3, true),
('electronica-y-tecnologia-vehicular', 'Electrónica y Tecnología Vehicular', '/images/categorias/electronica-y-tecnologia-vehicular.webp', 4, true),
('auxilio-vehicular', 'Auxilio Vehicular', '/images/categorias/auxilio-vehicular.webp', 5, true),
('remolque', 'Remolque', '/images/categorias/remolque.webp', 6, true),
('molduras-y-protectores', 'Molduras y Protectores', '/images/categorias/molduras-y-protectores.webp', 7, true),
('mantenimiento-y-herramientas', 'Mantenimiento y Herramientas', '/images/categorias/mantenimiento-y-herramientas.webp', 8, true),
('accesorios-tuning-y-decoracion', 'Accesorios Tuning y Decoración', '/images/categorias/accesorios-tuning-y-decoracion.webp', 9, true),
('para-trabajo-y-negocio', 'Para Trabajo y Negocio', '/images/categorias/para-trabajo-y-negocio.webp', 10, true),
('seguros', 'Seguros', '/images/categorias/seguros.webp', 11, true)
on conflict (slug) do update set nombre = excluded.nombre, foto_url = excluded.foto_url, orden = excluded.orden, activo = excluded.activo;

update productos set categoria_slug = 'auxilio-vehicular', subcategoria = 'Kit de Emergencia', tipo = null where sku = 'AUX-001';
update productos set categoria_slug = 'auxilio-vehicular', subcategoria = 'Gata Hidráulica', tipo = null where sku = 'AUX-002';
update productos set categoria_slug = 'auxilio-vehicular', subcategoria = 'Compresora de Aire', tipo = null where sku = 'AUX-003';
update productos set categoria_slug = 'auxilio-vehicular', subcategoria = 'Cables para Batería', tipo = null where sku = 'AUX-004';
update productos set categoria_slug = 'mantenimiento-y-herramientas', subcategoria = 'Cinta Adhesiva', tipo = null where sku = 'CIN-001';
update productos set categoria_slug = 'mantenimiento-y-herramientas', subcategoria = 'Cinta Antideslizante', tipo = null where sku = 'CIN-002';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Parrillas', tipo = null where sku = 'EXT-001';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Barras Transversales', tipo = null where sku = 'EXT-002';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Porta Bicicletas', tipo = null where sku = 'EXT-003';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED', tipo = null where sku = 'FL-RA21';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED', tipo = null where sku = 'ILU-001';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Barras LED', tipo = null where sku = 'ILU-002';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Accesorios de Iluminación', tipo = null where sku = 'ILU-003';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Forros de Timón', tipo = null where sku = 'INT-001';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Cobertores', tipo = null where sku = 'INT-002';
update productos set categoria_slug = 'mantenimiento-y-herramientas', subcategoria = 'Pulidor Recargable', tipo = null where sku = 'LIM-001';
update productos set categoria_slug = 'mantenimiento-y-herramientas', subcategoria = 'Pistola de Limpieza', tipo = null where sku = 'LIM-002';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Porta Bicicletas', tipo = null where sku = 'LR-BC04';
update productos set categoria_slug = 'equipamiento-exterior', subcategoria = 'Porta Bicicletas', tipo = null where sku = 'LR-BC05';
update productos set categoria_slug = 'molduras-y-protectores', subcategoria = 'Protectores de Pisadera', tipo = null where sku = 'MOL-001';
update productos set categoria_slug = 'molduras-y-protectores', subcategoria = 'Topes de Puerta', tipo = null where sku = 'MOL-002';
update productos set categoria_slug = 'remolque', subcategoria = 'Faja de Remolque', tipo = null where sku = 'REM-001';
update productos set categoria_slug = 'remolque', subcategoria = 'Bola de Remolque', tipo = null where sku = 'REM-002';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Faros LED', tipo = null where sku = 'RL-CC21';
update productos set categoria_slug = 'molduras-y-protectores', subcategoria = 'Molduras Laterales', tipo = null where sku = 'SD-RV24-BKC';
update productos set categoria_slug = 'seguros', subcategoria = 'Seguro de Ruedas', tipo = null where sku = 'SEG-001';
update productos set categoria_slug = 'seguros', subcategoria = 'Tuercas de Aluminio', tipo = null where sku = 'SEG-002';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Circulinas de Emergencia', tipo = null where sku = 'SK-CPL88-BL';
update productos set categoria_slug = 'electronica-y-tecnologia-vehicular', subcategoria = 'Sistemas de Seguridad', tipo = null where sku = 'SK-DWKEY1-C';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Respaldares Ergonómicos', tipo = null where sku = 'SK-JRRL01-BL';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Respaldares Ergonómicos', tipo = null where sku = 'SK-JRRL01-GR';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Organización y Practicidad', tipo = null where sku = 'SK-KFOZ02-BK';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Iluminación Decorativa', tipo = null where sku = 'SK-LL04-RB';
update productos set categoria_slug = 'iluminacion', subcategoria = 'Iluminación Decorativa', tipo = null where sku = 'SK-LL04-WH';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Respaldares Ergonómicos', tipo = null where sku = 'SK-RETH01';
update productos set categoria_slug = 'interior-y-confort', subcategoria = 'Respaldares Ergonómicos', tipo = null where sku = 'SK-RETH02';
update productos set categoria_slug = 'remolque', subcategoria = 'Correa de Remolque', tipo = null where sku = 'SK-SS8TON';
update productos set categoria_slug = 'remolque', subcategoria = 'Faja de Remolque', tipo = null where sku = 'SK-TP005';
update productos set categoria_slug = 'para-trabajo-y-negocio', subcategoria = 'Carrito Porta Herramientas', tipo = null where sku = 'TRA-001';
update productos set categoria_slug = 'para-trabajo-y-negocio', subcategoria = 'Lámpara de Trabajo', tipo = null where sku = 'TRA-002';
update productos set categoria_slug = 'accesorios-tuning-y-decoracion', subcategoria = 'Porta Placas', tipo = null where sku = 'TUN-001';
update productos set categoria_slug = 'accesorios-tuning-y-decoracion', subcategoria = 'Extintor Deportivo', tipo = null where sku = 'TUN-002';
update productos set categoria_slug = 'accesorios-tuning-y-decoracion', subcategoria = 'Llaveros', tipo = null where sku = 'TUN-003';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'REM-002' and imagen = '/images/categorias/remolque.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'TUN-001' and imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'AUX-001' and imagen = '/images/categorias/auxilio-vehicular.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'AUX-002' and imagen = '/images/categorias/auxilio-vehicular.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'AUX-003' and imagen = '/images/categorias/auxilio-vehicular.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'AUX-004' and imagen = '/images/categorias/auxilio-vehicular.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'CIN-001' and imagen = '/images/categorias/mantenimiento-y-herramientas.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'CIN-002' and imagen = '/images/categorias/mantenimiento-y-herramientas.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'INT-002' and imagen = '/images/categorias/interior-y-confort.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'LIM-001' and imagen = '/images/categorias/mantenimiento-y-herramientas.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'LIM-002' and imagen = '/images/categorias/mantenimiento-y-herramientas.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'MOL-001' and imagen = '/images/categorias/molduras-y-protectores.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'MOL-002' and imagen = '/images/categorias/molduras-y-protectores.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'REM-001' and imagen = '/images/categorias/remolque.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'SEG-001' and imagen = '/images/categorias/seguros.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'SEG-002' and imagen = '/images/categorias/seguros.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'TRA-001' and imagen = '/images/categorias/para-trabajo-y-negocio.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'TRA-002' and imagen = '/images/categorias/para-trabajo-y-negocio.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'TUN-002' and imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp';
update productos set imagen = '/images/placeholder-producto.svg' where sku = 'TUN-003' and imagen = '/images/categorias/accesorios-tuning-y-decoracion.webp';

delete from subcategorias;
insert into subcategorias (categoria_slug, nombre, orden) values
('iluminacion', 'Faros LED', 0),
('iluminacion', 'Barras LED', 1),
('iluminacion', 'Accesorios de Iluminación', 2),
('iluminacion', 'Iluminación Decorativa', 3),
('accesorios-tuning-y-decoracion', 'Extintor Deportivo', 0),
('accesorios-tuning-y-decoracion', 'Llaveros', 1),
('accesorios-tuning-y-decoracion', 'Porta Placas', 2),
('auxilio-vehicular', 'Cables para Batería', 0),
('auxilio-vehicular', 'Compresora de Aire', 1),
('auxilio-vehicular', 'Gata Hidráulica', 2),
('auxilio-vehicular', 'Kit de Emergencia', 3),
('remolque', 'Bola de Remolque', 0),
('remolque', 'Correa de Remolque', 1),
('remolque', 'Faja de Remolque', 2),
('mantenimiento-y-herramientas', 'Pulidor Recargable', 0),
('mantenimiento-y-herramientas', 'Pistola de Limpieza', 1),
('mantenimiento-y-herramientas', 'Cinta Adhesiva', 2),
('mantenimiento-y-herramientas', 'Cinta Antideslizante', 3),
('equipamiento-exterior', 'Barras Transversales', 0),
('equipamiento-exterior', 'Parrillas', 1),
('equipamiento-exterior', 'Porta Bicicletas', 2),
('para-trabajo-y-negocio', 'Carrito Porta Herramientas', 0),
('para-trabajo-y-negocio', 'Lámpara de Trabajo', 1),
('molduras-y-protectores', 'Protectores de Pisadera', 0),
('molduras-y-protectores', 'Topes de Puerta', 1),
('seguros', 'Seguro de Ruedas', 0),
('seguros', 'Tuercas de Aluminio', 1),
('interior-y-confort', 'Forros de Timón', 0),
('interior-y-confort', 'Cobertores', 1),
('interior-y-confort', 'Respaldares Ergonómicos', 2),
('molduras-y-protectores', 'Molduras Laterales', 2),
('iluminacion', 'Circulinas de Emergencia', 4),
('interior-y-confort', 'Organización y Practicidad', 3),
('electronica-y-tecnologia-vehicular', 'Sistemas de Seguridad', 0)
;

delete from tipos_producto where categoria_slug in ('accesorios-electricos', 'accesorios-para-camiones', 'accesorios-para-motos', 'cuidado-y-limpieza', 'herramientas', 'repuestos-y-mas', 'seguridad-auxilio-y-remolque', 'tuning-y-personalizacion');
delete from categorias c
where c.slug in ('accesorios-electricos', 'accesorios-para-camiones', 'accesorios-para-motos', 'cuidado-y-limpieza', 'herramientas', 'repuestos-y-mas', 'seguridad-auxilio-y-remolque', 'tuning-y-personalizacion')
  and not exists (select 1 from productos p where p.categoria_slug = c.slug);

commit;
