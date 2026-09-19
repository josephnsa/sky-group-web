-- Corrige la codificación de texto (tildes/ñ) de los 10 productos nuevos
-- insertados con docs/migracion-imagenes-productos-y-nuevos.sql — al pegarlos
-- en el SQL Editor de Supabase quedaron con caracteres corruptos tipo
-- "CerÃ¡mico" en vez de "Cerámico" (doble codificación UTF-8). Corre esto
-- una sola vez para dejarlos bien.

update productos set
  nombre = 'Luces de Rejilla LED Rojo y Azul con Control',
  subcategoria = 'Iluminación Decorativa',
  descripcion = 'Personaliza tu auto con este kit de luces de rejilla LED bicolor (rojo y azul) para instalar en la parrilla delantera. Incluye un módulo de control con múltiples modos de parpadeo, incluido strobo, para darle a tu vehículo un estilo moderno y llamativo. Producto de uso decorativo, no reemplaza las luces reglamentarias del vehículo.',
  especificaciones = '[{"etiqueta": "Voltaje", "valor": "12V"}, {"etiqueta": "Colores", "valor": "Rojo y azul"}, {"etiqueta": "Función", "valor": "Strobo / intermitente con control"}, {"etiqueta": "Tamaño por módulo", "valor": "70 × 28 × 15 mm"}, {"etiqueta": "Incluye", "valor": "4 módulos LED (2 rojos, 2 azules), 1 control, cableado y conectores"}]'::jsonb
where sku = 'SK-LL04-RB';

update productos set
  nombre = 'Luces de Rejilla LED Blanco con Control',
  subcategoria = 'Iluminación Decorativa',
  descripcion = 'Dale un estilo moderno y mayor visibilidad a tu auto con este kit de luces de rejilla en color blanco. Luces LED de alta intensidad para instalar en la parrilla delantera, con módulo controlador de distintos modos de parpadeo tipo strobo.',
  especificaciones = '[{"etiqueta": "Voltaje", "valor": "12V"}, {"etiqueta": "Color", "valor": "Luz blanca"}, {"etiqueta": "Función", "valor": "Strobo / intermitente con control"}, {"etiqueta": "Tamaño por módulo", "valor": "70 × 28 × 15 mm"}, {"etiqueta": "Incluye", "valor": "4 módulos LED blancos, 1 control, cableado y conectores"}]'::jsonb
where sku = 'SK-LL04-WH';

update productos set
  nombre = 'Tapa Neblinero LED para RAV4 2019-2025',
  subcategoria = 'Faros LED',
  descripcion = 'Moderniza el frente de tu Toyota RAV4 (2019-2025) con estas tapas neblineras LED. Su tecnología Dual LED ofrece luz diurna (DRL) y señal direccional integrada, manteniendo un ajuste perfecto con las líneas originales del parachoque.',
  especificaciones = '[{"etiqueta": "Compatibilidad", "valor": "Toyota RAV4 2019-2025"}, {"etiqueta": "Tipo de luz", "valor": "Dual LED (diurna + direccional)"}, {"etiqueta": "Color de luz", "valor": "Blanco / Ámbar"}, {"etiqueta": "Voltaje", "valor": "12V"}, {"etiqueta": "Incluye", "valor": "Par de tapas LED con cableado y conectores"}]'::jsonb
where sku = 'FL-RA21';

update productos set
  nombre = 'Reflector LED para Corolla Cross 2021-2025',
  subcategoria = 'Faros LED',
  descripcion = 'Mejora el estilo de tu Toyota Corolla Cross (2021-2025) con este reflector LED posterior, que reemplaza los reflectores originales de la defensa trasera. Con 3 funciones: luz baja (conducción normal), luz alta (freno) y señal direccional con barrido, sin alterar la estética original del auto.',
  especificaciones = '[{"etiqueta": "Compatibilidad", "valor": "Toyota Corolla Cross 2021-2025"}, {"etiqueta": "Funciones", "valor": "Conducción, freno y direccional"}, {"etiqueta": "Color de luz", "valor": "Naranja / Rojo"}, {"etiqueta": "Material", "valor": "Acrílico + LED de alta luminosidad"}, {"etiqueta": "Voltaje", "valor": "12V"}, {"etiqueta": "Incluye", "valor": "Par de reflectores LED con conectores"}]'::jsonb
where sku = 'RL-CC21';

update productos set
  nombre = 'Correa para Remolque 8 Toneladas',
  subcategoria = 'Correa de Remolque',
  descripcion = 'Remolca con total seguridad con esta correa para remolque de 8000 kg. Fabricada con fibras de poliéster de alta tenacidad, agarraderas doblemente reforzadas y color naranja de alta visibilidad — ideal para emergencias, rescates o uso profesional.',
  especificaciones = '[{"etiqueta": "Capacidad máxima", "valor": "8000 kg (8 TON)"}, {"etiqueta": "Medidas", "valor": "75 mm de ancho x 6 m de largo"}, {"etiqueta": "Espesor", "valor": "3 mm"}, {"etiqueta": "Peso empacado", "valor": "1.3 kg"}]'::jsonb
where sku = 'SK-SS8TON';

update productos set
  nombre = 'Faja de Remolque SKY 5 Toneladas',
  subcategoria = 'Faja de Remolque',
  descripcion = 'La faja de remolque SKY de 5 toneladas está diseñada para resistir, brindar seguridad y eficiencia en cualquier situación de remolque. Construida en nylon de alta calidad con ganchos de acero reforzados, incluye un práctico estuche para almacenarla.',
  especificaciones = '[{"etiqueta": "Capacidad máxima", "valor": "5 TON (5000 kg)"}, {"etiqueta": "Largo", "valor": "5 m aprox."}, {"etiqueta": "Ancho", "valor": "50 mm"}, {"etiqueta": "Color", "valor": "Amarillo"}]'::jsonb
where sku = 'SK-TP005';

update productos set
  nombre = 'Respaldar Lumbar Cerámico Lila - Fresco',
  subcategoria = 'Respaldares Ergonómicos',
  descripcion = 'Disfruta de una conducción más fresca y cómoda con este respaldar cerámico. Sus cuentas cerámicas distribuyen la presión de manera uniforme, dan soporte lumbar y permiten la circulación del aire. Borde de alambre de acero cubierto con tela resistente para mayor firmeza y durabilidad.',
  especificaciones = '[{"etiqueta": "Material", "valor": "Cuentas cerámicas + estructura de alambre de acero"}, {"etiqueta": "Color", "valor": "Lila"}, {"etiqueta": "Se adapta a", "valor": "Asientos de auto, sillas de oficina y hogar"}]'::jsonb
where sku = 'SK-JRRL01-BL';

update productos set
  nombre = 'Respaldar Lumbar Cerámico Verde - Fresco',
  subcategoria = 'Respaldares Ergonómicos',
  descripcion = 'El respaldar cerámico está diseñado para ofrecer comodidad y frescura durante cada viaje. Su estructura de cuentas cerámicas permite una adecuada ventilación de la espalda, reduciendo la sudoración y brindando un soporte ergonómico ideal incluso por largos periodos.',
  especificaciones = '[{"etiqueta": "Material", "valor": "Cuentas cerámicas + estructura de alambre de acero"}, {"etiqueta": "Color", "valor": "Verde"}, {"etiqueta": "Se adapta a", "valor": "Asientos de auto, sillas de oficina y hogar"}]'::jsonb
where sku = 'SK-JRRL01-GR';

update productos set
  nombre = 'Respaldar Ortopédico de Espuma',
  subcategoria = 'Respaldares Ergonómicos',
  descripcion = 'Disfruta de un confort superior con este respaldar lumbar ortopédico, elaborado con espuma viscoelástica indeformable que se adapta a tu zona lumbar, aliviando la presión y mejorando la postura. Suave al tacto, ergonómico y transpirable — perfecto para conductores, oficinistas o uso diario.',
  especificaciones = '[{"etiqueta": "Material", "valor": "Espuma viscoelástica de alta densidad"}, {"etiqueta": "Color", "valor": "Negro"}, {"etiqueta": "Funda", "valor": "Desmontable y lavable"}, {"etiqueta": "Presentación", "valor": "Sellado al vacío"}]'::jsonb
where sku = 'SK-RETH01';

update productos set
  nombre = 'Respaldar Ortopédico de Espuma Compacto',
  subcategoria = 'Respaldares Ergonómicos',
  descripcion = 'El respaldar ortopédico compacto brinda soporte lumbar con su espuma viscoelástica de alta densidad, adaptándose a la espalda del conductor. Proporciona comodidad, firmeza y una postura correcta — perfecto para el auto, la oficina o el hogar.',
  especificaciones = '[{"etiqueta": "Material", "valor": "Espuma viscoelástica indeformable"}, {"etiqueta": "Color", "valor": "Negro"}, {"etiqueta": "Funda", "valor": "Desmontable y lavable"}, {"etiqueta": "Presentación", "valor": "Sellado al vacío"}]'::jsonb
where sku = 'SK-RETH02';
