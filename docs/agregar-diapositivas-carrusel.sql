-- Agrega 2 diapositivas más al carrusel de Home (quedan 5 en total, los 5
-- puntos que se ven abajo) — de momento reusan la misma imagen que ya
-- estaba subida; reemplázalas por fotos distintas desde /admin/carrusel
-- cuando las tengas.
insert into carousel_slides (imagen_url, titulo, enlace, orden, activo) values
('/images/hero/banner-equipamiento.webp', null, null, 3, true),
('/images/hero/banner-equipamiento.webp', null, null, 4, true);
