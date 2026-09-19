-- 1) Nueva columna para la galería de fotos por producto (además de `imagen`,
--    que sigue siendo la foto principal). Se guarda como un arreglo JSON de
--    rutas, ej. ["/images/productos/SK-TP005-2.webp", "..."].
alter table productos add column if not exists imagenes jsonb;

-- 2) Los 10 productos reales nuevos recibidos (fotos ya procesadas y subidas
--    al repo en public/images/productos/, sin precio porque no venía en la
--    ficha — se cotiza por WhatsApp como el resto del catálogo).

insert into productos (
  sku, categoria_slug, subcategoria, nombre, marca, precio, imagen, imagenes,
  descripcion, destacado, especificaciones
) values

('SK-LL04-RB', 'iluminacion', 'Iluminación Decorativa', 'Luces de Rejilla LED Rojo y Azul con Control', 'SKY', null,
 '/images/productos/SK-LL04-RB-1.webp',
 '["/images/productos/SK-LL04-RB-2.webp","/images/productos/SK-LL04-RB-3.webp","/images/productos/SK-LL04-RB-4.webp"]',
 'Personaliza tu auto con este kit de luces de rejilla LED bicolor (rojo y azul) para instalar en la parrilla delantera. Incluye un módulo de control con múltiples modos de parpadeo, incluido strobo, para darle a tu vehículo un estilo moderno y llamativo. Producto de uso decorativo, no reemplaza las luces reglamentarias del vehículo.',
 false,
 '[{"etiqueta":"Voltaje","valor":"12V"},{"etiqueta":"Colores","valor":"Rojo y azul"},{"etiqueta":"Función","valor":"Strobo / intermitente con control"},{"etiqueta":"Tamaño por módulo","valor":"70 × 28 × 15 mm"},{"etiqueta":"Incluye","valor":"4 módulos LED (2 rojos, 2 azules), 1 control, cableado y conectores"}]'
),

('SK-LL04-WH', 'iluminacion', 'Iluminación Decorativa', 'Luces de Rejilla LED Blanco con Control', 'SKY', null,
 '/images/productos/SK-LL04-WH-1.webp',
 '["/images/productos/SK-LL04-WH-2.webp","/images/productos/SK-LL04-WH-3.webp","/images/productos/SK-LL04-WH-4.webp","/images/productos/SK-LL04-WH-5.webp"]',
 'Dale un estilo moderno y mayor visibilidad a tu auto con este kit de luces de rejilla en color blanco. Luces LED de alta intensidad para instalar en la parrilla delantera, con módulo controlador de distintos modos de parpadeo tipo strobo.',
 false,
 '[{"etiqueta":"Voltaje","valor":"12V"},{"etiqueta":"Color","valor":"Luz blanca"},{"etiqueta":"Función","valor":"Strobo / intermitente con control"},{"etiqueta":"Tamaño por módulo","valor":"70 × 28 × 15 mm"},{"etiqueta":"Incluye","valor":"4 módulos LED blancos, 1 control, cableado y conectores"}]'
),

('FL-RA21', 'iluminacion', 'Faros LED', 'Tapa Neblinero LED para RAV4 2019-2025', 'SKY', null,
 '/images/productos/FL-RA21-1.webp',
 '["/images/productos/FL-RA21-2.webp","/images/productos/FL-RA21-3.webp"]',
 'Moderniza el frente de tu Toyota RAV4 (2019-2025) con estas tapas neblineras LED. Su tecnología Dual LED ofrece luz diurna (DRL) y señal direccional integrada, manteniendo un ajuste perfecto con las líneas originales del parachoque.',
 false,
 '[{"etiqueta":"Compatibilidad","valor":"Toyota RAV4 2019-2025"},{"etiqueta":"Tipo de luz","valor":"Dual LED (diurna + direccional)"},{"etiqueta":"Color de luz","valor":"Blanco / Ámbar"},{"etiqueta":"Voltaje","valor":"12V"},{"etiqueta":"Incluye","valor":"Par de tapas LED con cableado y conectores"}]'
),

('RL-CC21', 'iluminacion', 'Faros LED', 'Reflector LED para Corolla Cross 2021-2025', 'SKY', null,
 '/images/productos/RL-CC21-1.webp',
 '["/images/productos/RL-CC21-2.webp","/images/productos/RL-CC21-3.webp"]',
 'Mejora el estilo de tu Toyota Corolla Cross (2021-2025) con este reflector LED posterior, que reemplaza los reflectores originales de la defensa trasera. Con 3 funciones: luz baja (conducción normal), luz alta (freno) y señal direccional con barrido, sin alterar la estética original del auto.',
 false,
 '[{"etiqueta":"Compatibilidad","valor":"Toyota Corolla Cross 2021-2025"},{"etiqueta":"Funciones","valor":"Conducción, freno y direccional"},{"etiqueta":"Color de luz","valor":"Naranja / Rojo"},{"etiqueta":"Material","valor":"Acrílico + LED de alta luminosidad"},{"etiqueta":"Voltaje","valor":"12V"},{"etiqueta":"Incluye","valor":"Par de reflectores LED con conectores"}]'
),

('SK-SS8TON', 'remolque', 'Correa de Remolque', 'Correa para Remolque 8 Toneladas', 'SKY', null,
 '/images/productos/SK-SS8TON-1.webp',
 '["/images/productos/SK-SS8TON-2.webp","/images/productos/SK-SS8TON-3.webp","/images/productos/SK-SS8TON-4.webp","/images/productos/SK-SS8TON-5.webp"]',
 'Remolca con total seguridad con esta correa para remolque de 8000 kg. Fabricada con fibras de poliéster de alta tenacidad, agarraderas doblemente reforzadas y color naranja de alta visibilidad — ideal para emergencias, rescates o uso profesional.',
 false,
 '[{"etiqueta":"Capacidad máxima","valor":"8000 kg (8 TON)"},{"etiqueta":"Medidas","valor":"75 mm de ancho x 6 m de largo"},{"etiqueta":"Espesor","valor":"3 mm"},{"etiqueta":"Peso empacado","valor":"1.3 kg"}]'
),

('SK-TP005', 'remolque', 'Faja de Remolque', 'Faja de Remolque SKY 5 Toneladas', 'SKY', null,
 '/images/productos/SK-TP005-1.webp',
 '["/images/productos/SK-TP005-2.webp","/images/productos/SK-TP005-3.webp","/images/productos/SK-TP005-4.webp","/images/productos/SK-TP005-5.webp","/images/productos/SK-TP005-6.webp"]',
 'La faja de remolque SKY de 5 toneladas está diseñada para resistir, brindar seguridad y eficiencia en cualquier situación de remolque. Construida en nylon de alta calidad con ganchos de acero reforzados, incluye un práctico estuche para almacenarla.',
 false,
 '[{"etiqueta":"Capacidad máxima","valor":"5 TON (5000 kg)"},{"etiqueta":"Largo","valor":"5 m aprox."},{"etiqueta":"Ancho","valor":"50 mm"},{"etiqueta":"Color","valor":"Amarillo"}]'
),

('SK-JRRL01-BL', 'interior-y-confort', 'Respaldares Ergonómicos', 'Respaldar Lumbar Cerámico Lila - Fresco', 'SKY', null,
 '/images/productos/SK-JRRL01-BL-1.webp',
 '["/images/productos/SK-JRRL01-BL-2.webp","/images/productos/SK-JRRL01-BL-3.webp","/images/productos/SK-JRRL01-BL-4.webp","/images/productos/SK-JRRL01-BL-5.webp","/images/productos/SK-JRRL01-BL-6.webp"]',
 'Disfruta de una conducción más fresca y cómoda con este respaldar cerámico. Sus cuentas cerámicas distribuyen la presión de manera uniforme, dan soporte lumbar y permiten la circulación del aire. Borde de alambre de acero cubierto con tela resistente para mayor firmeza y durabilidad.',
 false,
 '[{"etiqueta":"Material","valor":"Cuentas cerámicas + estructura de alambre de acero"},{"etiqueta":"Color","valor":"Lila"},{"etiqueta":"Se adapta a","valor":"Asientos de auto, sillas de oficina y hogar"}]'
),

('SK-JRRL01-GR', 'interior-y-confort', 'Respaldares Ergonómicos', 'Respaldar Lumbar Cerámico Verde - Fresco', 'SKY', null,
 '/images/productos/SK-JRRL01-GR-1.webp',
 '["/images/productos/SK-JRRL01-GR-2.webp","/images/productos/SK-JRRL01-GR-3.webp","/images/productos/SK-JRRL01-GR-4.webp","/images/productos/SK-JRRL01-GR-5.webp","/images/productos/SK-JRRL01-GR-6.webp"]',
 'El respaldar cerámico está diseñado para ofrecer comodidad y frescura durante cada viaje. Su estructura de cuentas cerámicas permite una adecuada ventilación de la espalda, reduciendo la sudoración y brindando un soporte ergonómico ideal incluso por largos periodos.',
 false,
 '[{"etiqueta":"Material","valor":"Cuentas cerámicas + estructura de alambre de acero"},{"etiqueta":"Color","valor":"Verde"},{"etiqueta":"Se adapta a","valor":"Asientos de auto, sillas de oficina y hogar"}]'
),

('SK-RETH01', 'interior-y-confort', 'Respaldares Ergonómicos', 'Respaldar Ortopédico de Espuma', 'SKY', null,
 '/images/productos/SK-RETH01-1.webp',
 '["/images/productos/SK-RETH01-2.webp","/images/productos/SK-RETH01-3.webp","/images/productos/SK-RETH01-4.webp","/images/productos/SK-RETH01-5.webp","/images/productos/SK-RETH01-6.webp"]',
 'Disfruta de un confort superior con este respaldar lumbar ortopédico, elaborado con espuma viscoelástica indeformable que se adapta a tu zona lumbar, aliviando la presión y mejorando la postura. Suave al tacto, ergonómico y transpirable — perfecto para conductores, oficinistas o uso diario.',
 false,
 '[{"etiqueta":"Material","valor":"Espuma viscoelástica de alta densidad"},{"etiqueta":"Color","valor":"Negro"},{"etiqueta":"Funda","valor":"Desmontable y lavable"},{"etiqueta":"Presentación","valor":"Sellado al vacío"}]'
),

('SK-RETH02', 'interior-y-confort', 'Respaldares Ergonómicos', 'Respaldar Ortopédico de Espuma Compacto', 'SKY', null,
 '/images/productos/SK-RETH02-1.webp',
 '["/images/productos/SK-RETH02-2.webp","/images/productos/SK-RETH02-3.webp","/images/productos/SK-RETH02-4.webp","/images/productos/SK-RETH02-5.webp"]',
 'El respaldar ortopédico compacto brinda soporte lumbar con su espuma viscoelástica de alta densidad, adaptándose a la espalda del conductor. Proporciona comodidad, firmeza y una postura correcta — perfecto para el auto, la oficina o el hogar.',
 false,
 '[{"etiqueta":"Material","valor":"Espuma viscoelástica indeformable"},{"etiqueta":"Color","valor":"Negro"},{"etiqueta":"Funda","valor":"Desmontable y lavable"},{"etiqueta":"Presentación","valor":"Sellado al vacío"}]'
);
