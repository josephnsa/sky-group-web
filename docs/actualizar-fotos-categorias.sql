-- Actualiza la foto de portada de 8 categorías con las fotos reales del
-- negocio (antes eran fotos curadas de bancos gratuitos por categoría, o
-- directamente no tenían foto — caso de "4x4 / Off Road", vacía hasta ahora).
update categorias set foto_url = '/images/categorias/iluminacion.webp' where slug = 'iluminacion';
update categorias set foto_url = '/images/categorias/equipamiento-exterior.webp' where slug = 'equipamiento-exterior';
update categorias set foto_url = '/images/categorias/4x4-off-road.webp' where slug = '4x4-off-road';
update categorias set foto_url = '/images/categorias/interior-y-confort.webp' where slug = 'interior-y-confort';
update categorias set foto_url = '/images/categorias/auxilio-vehicular.webp' where slug = 'auxilio-vehicular';
update categorias set foto_url = '/images/categorias/remolque.webp' where slug = 'remolque';
update categorias set foto_url = '/images/categorias/para-trabajo-y-negocio.webp' where slug = 'para-trabajo-y-negocio';
update categorias set foto_url = '/images/categorias/mantenimiento-y-herramientas.webp' where slug = 'mantenimiento-y-herramientas';
