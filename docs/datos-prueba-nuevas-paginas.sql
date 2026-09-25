-- Datos de prueba para que /envios y /atencion-whatsapp se vean con
-- contenido real en vez de solo el texto por defecto. Las imágenes de
-- envíos reusan fotos ya curadas del sitio (no hay fotos reales de envíos
-- todavía) — reemplázalas cuando tengas fotos propias, subiéndolas desde
-- /admin/configuracion.

update configuracion_sitio set
  envios_texto = 'Coordinamos el envío de tu pedido a todo el Perú. En Lima Metropolitana la entrega se coordina directamente por WhatsApp según tu distrito (normalmente 1-2 días hábiles). Para provincias, trabajamos con agencias de transporte de confianza — el costo depende del destino y del tamaño del pedido, y el tiempo de entrega suele ser de 2 a 5 días hábiles según la ciudad.',
  envios_imagen_1 = '/images/hero/auto-real.webp',
  envios_imagen_2 = '/images/categorias/equipamiento-exterior.webp',
  atencion_mayorista_texto = 'Atendemos pedidos al por mayor para talleres, negocios y distribuidores a nivel nacional. Escríbenos por WhatsApp con el volumen que necesitas y te enviamos precios y condiciones especiales.'
where id = 1;
