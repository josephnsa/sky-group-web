-- Enlace opcional por producto para el botón "¡Conoce más!" de la ficha.
-- Si es un video de TikTok o YouTube, la web lo abre en un modal con el
-- reproductor oficial; cualquier otro enlace se abre en una pestaña nueva.
-- Si queda vacío, el botón sigue bajando a la ficha técnica como antes.
alter table productos add column if not exists enlace_conoce_mas text;

-- Faja de remolque SKY 5 toneladas → video de TikTok de SKY Group.
update productos
set enlace_conoce_mas = 'https://www.tiktok.com/@skygroupsac/video/7512182481278242054?is_from_webapp=1&sender_device=pc'
where sku = 'SK-TP005';
