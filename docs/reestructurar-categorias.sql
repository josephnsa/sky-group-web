-- Reestructuración de categorías a partir de la taxonomía completa recibida
-- en "CATEGORIA PRODUCTOS.xlsx" (hoja "Hoja 1"). Esa hoja tenía 22
-- categorías con bastante solapamiento entre sí (varias categorías de
-- electrónica/cableado repetidas); acá quedan consolidadas en 12, sin perder
-- ningún subgrupo — confirmado con el usuario antes de aplicar.
--
-- Resultado: de 11 categorías actuales pasa a 12 —
--   - "Limpieza y Pulido" y "Cintas y Adhesivos" se fusionan en
--     "Mantenimiento y Herramientas" (sus 4 productos se reasignan).
--   - "Equipamiento Exterior" se renombra a "Barras y Equipamiento Exterior"
--     (mismo slug, mismos productos — no rompe URLs existentes).
--   - Se agregan 2 categorías nuevas sin productos todavía (quedan listas
--     para cuando haya inventario real): "4x4 / Off Road" y
--     "Electrónica y Tecnología Vehicular".
--   - El resto (Iluminación, Accesorios Tuning y Decoración, Auxilio
--     Vehicular, Remolque, Para Trabajo y Negocio, Molduras y Protectores,
--     Seguros, Interior y Confort) no cambia.

-- 1) Nueva categoría "Mantenimiento y Herramientas"
insert into categorias (slug, nombre, foto_url, orden)
values ('mantenimiento-y-herramientas', 'Mantenimiento y Herramientas', null, 4);

-- 2) Mover los 4 productos de las 2 categorías que se fusionan
update productos set categoria_slug = 'mantenimiento-y-herramientas'
where sku in ('LIM-001', 'LIM-002', 'CIN-001', 'CIN-002');

-- 3) Borrar las 2 categorías ya vacías
delete from categorias where slug in ('limpieza-y-pulido', 'cintas-y-adhesivos');

-- 4) Renombrar "Equipamiento Exterior" (mismo slug, no rompe URLs)
update categorias set nombre = 'Barras y Equipamiento Exterior'
where slug = 'equipamiento-exterior';

-- 5) Dos categorías nuevas, sin productos todavía (aparecerán vacías en el
--    sitio hasta que se cargue inventario real de esos rubros)
insert into categorias (slug, nombre, foto_url, orden) values
('4x4-off-road', '4x4 / Off Road', null, 11),
('electronica-y-tecnologia-vehicular', 'Electrónica y Tecnología Vehicular', null, 12);

-- 6) Reordenar todas para que el menú quede prolijo (0 a 11)
update categorias set orden = 0 where slug = 'iluminacion';
update categorias set orden = 1 where slug = 'equipamiento-exterior';
update categorias set orden = 2 where slug = '4x4-off-road';
update categorias set orden = 3 where slug = 'interior-y-confort';
update categorias set orden = 4 where slug = 'electronica-y-tecnologia-vehicular';
update categorias set orden = 5 where slug = 'auxilio-vehicular';
update categorias set orden = 6 where slug = 'remolque';
update categorias set orden = 7 where slug = 'molduras-y-protectores';
update categorias set orden = 8 where slug = 'mantenimiento-y-herramientas';
update categorias set orden = 9 where slug = 'accesorios-tuning-y-decoracion';
update categorias set orden = 10 where slug = 'para-trabajo-y-negocio';
update categorias set orden = 11 where slug = 'seguros';
