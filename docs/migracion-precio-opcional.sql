-- Migración: el precio de un producto pasa a ser opcional.
--
-- Motivo: la mayoría de productos del catálogo real no va a tener un
-- precio cargado (se cotizan por WhatsApp) — hasta ahora `precio` era
-- obligatorio en la base de datos, así que no se podía guardar un
-- producto sin precio. El código ya está actualizado para mostrar
-- "Cotiza por WhatsApp" en vez del botón de carrito quando un producto
-- no tiene precio.
--
-- Correr esto una sola vez, en el SQL Editor de Supabase.

alter table productos alter column precio drop not null;
