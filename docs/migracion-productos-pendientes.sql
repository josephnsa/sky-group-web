-- Los 6 productos que el cliente envió con ficha y fotos en "PAG WEB SKY"
-- y que el Excel CATEGORIA PRODUCTOS.xlsx marca como pendientes de subir a
-- la web. Los otros 10 de esa carpeta ya estaban cargados
-- (migracion-imagenes-productos-y-nuevos.sql).
--
-- Fotos ya procesadas en public/images/productos/ (WebP, 900 px de ancho).
-- Sin precio porque las fichas no lo traen: se cotiza por WhatsApp, igual
-- que el resto. Marca SKY, el mismo criterio de los 10 productos anteriores
-- (las fichas de LR-BC04/05, SD-RV24-BKC, SK-KFOZ02-BK y SK-DWKEY1-C no la
-- indican; confirmar con el negocio).
--
-- "on conflict do nothing": si alguno ya se cargó a mano desde el admin, no
-- se pisa.

-- Subcategorías nuevas (para el desplegable del admin y el mega menú).
insert into subcategorias (categoria_slug, nombre, orden) values
('molduras-y-protectores', 'Molduras Laterales', 2),
('iluminacion', 'Circulinas de Emergencia', 4),
('interior-y-confort', 'Organización y Practicidad', 3),
('electronica-y-tecnologia-vehicular', 'Sistemas de Seguridad', 0)
on conflict (categoria_slug, nombre) do nothing;

insert into productos (
  sku, categoria_slug, subcategoria, nombre, marca, precio, imagen, imagenes,
  descripcion, destacado, compatibilidad, especificaciones
) values

('LR-BC04', 'equipamiento-exterior', 'Porta Bicicletas', 'Porta Bicicleta de Maletera para 2 Bicicletas', 'SKY', null,
 '/images/productos/LR-BC04-1.webp',
 '["/images/productos/LR-BC04-2.webp","/images/productos/LR-BC04-3.webp","/images/productos/LR-BC04-4.webp"]',
 'Transporta tus bicicletas de forma práctica y segura con el porta bicicleta universal para maletera de 2 bicicletas. Su sistema de sujeción mediante correas ajustables y diferentes puntos de apoyo mantiene las bicicletas sujetas durante el traslado, y sus almohadillas reducen el contacto directo con la carrocería. Una opción práctica para viajes, salidas familiares, fines de semana y rutas en bicicleta. Antes de iniciar el traslado, verifica que esté correctamente instalado y que las bicicletas estén firmemente sujetas; revisa periódicamente las correas durante el recorrido.',
 false, null,
 '[{"etiqueta":"Capacidad","valor":"2 bicicletas"},{"etiqueta":"Instalación","valor":"Maletera, diseño universal"},{"etiqueta":"Sujeción","valor":"Correas ajustables"},{"etiqueta":"Protección","valor":"Almohadillas de apoyo y soportes con recubrimiento de goma"},{"etiqueta":"Montaje","valor":"Fácil instalación y desmontaje"},{"etiqueta":"Compatibilidad","valor":"Universal; puede variar según el modelo y la configuración de la maletera"}]'
),

('LR-BC05', 'equipamiento-exterior', 'Porta Bicicletas', 'Porta Bicicleta de Maletera para 3 Bicicletas', 'SKY', null,
 '/images/productos/LR-BC05-1.webp',
 '["/images/productos/LR-BC05-2.webp","/images/productos/LR-BC05-3.webp","/images/productos/LR-BC05-4.webp"]',
 'Transporta hasta 3 bicicletas de forma práctica y segura con el porta bicicletas universal para maletera. Su estructura cuenta con soportes y almohadillas de apoyo que mantienen las bicicletas sujetas durante el traslado, y sus correas ajustables aseguran el conjunto al vehículo. Ideal para viajes, salidas de fin de semana y rutas en bicicleta. Con carga, no superar los 100 km/h (80 km/h con viento) y reducir la velocidad en caminos sinuosos o en mal estado. Verifica las correas y la carga antes de cada viaje y desmonta el producto cuando no esté en uso. El uso seguro y adecuado del producto es responsabilidad del usuario.',
 false, null,
 '[{"etiqueta":"Capacidad","valor":"3 bicicletas"},{"etiqueta":"Peso máximo recomendado","valor":"45 kg"},{"etiqueta":"Instalación","valor":"Maletera, diseño universal"},{"etiqueta":"Sujeción","valor":"Correas ajustables"},{"etiqueta":"Protección","valor":"Almohadillas de apoyo y soportes con recubrimiento de goma"},{"etiqueta":"Velocidad máxima con carga","valor":"100 km/h (80 km/h con viento)"}]'
),

('SD-RV24-BKC', 'molduras-y-protectores', 'Molduras Laterales', 'Moldura Lateral para Hilux Revo 2015-2025', 'SKY', null,
 '/images/productos/SD-RV24-BKC-1.webp',
 '["/images/productos/SD-RV24-BKC-2.webp"]',
 'Renueva el estilo de tu Hilux Revo (2015-2025) con las molduras laterales de puerta, diseñadas para ofrecer un acabado elegante y deportivo. Fabricadas con material resistente y de alta calidad, protegen la carrocería de pequeños golpes o rayaduras al abrir las puertas. Su diseño se adapta al contorno del vehículo y realza su apariencia con un acabado mate y detalles cromados. Instalación adhesiva, sin perforaciones.',
 false, '["Toyota Hilux Revo 2015-2025"]',
 '[{"etiqueta":"Compatibilidad","valor":"Toyota Hilux Revo 2015-2025"},{"etiqueta":"Material","valor":"Plástico ABS de alta resistencia"},{"etiqueta":"Acabado","valor":"Mate con detalle cromado"},{"etiqueta":"Instalación","valor":"Adhesiva, sin perforaciones"},{"etiqueta":"Ubicación","valor":"Puertas laterales"},{"etiqueta":"Función","valor":"Protección y diseño decorativo"},{"etiqueta":"Incluye","valor":"Juego completo para las 4 puertas, con adhesivo incluido"}]'
),

('SK-CPL88-BL', 'iluminacion', 'Circulinas de Emergencia', 'Circulina de Emergencia LED Azul', 'SKY', null,
 '/images/productos/SK-CPL88-BL-1.webp',
 '["/images/productos/SK-CPL88-BL-2.webp","/images/productos/SK-CPL88-BL-3.webp"]',
 'Barra LED estroboscópica multiflash de 46" con altavoz incorporado, diseñada para instalarse en el techo de vehículos y brindar señalización visual de alta visibilidad. Cuenta con 88 LEDs de color azul, alimentación de 12/24V y una potencia de 100W. Incorpora sirena de más de 120 dB, micrófono y controlador para gestionar el funcionamiento del sistema. Su diseño alargado de 118 cm proporciona una amplia cobertura de señalización y viene con soportes para su instalación sobre el vehículo.',
 false, null,
 '[{"etiqueta":"Tipo","valor":"Barra de emergencia LED"},{"etiqueta":"Color","valor":"Azul"},{"etiqueta":"Voltaje","valor":"12V / 24V"},{"etiqueta":"Potencia","valor":"100W"},{"etiqueta":"Cantidad de LEDs","valor":"88"},{"etiqueta":"Sirena","valor":"Más de 120 dB"},{"etiqueta":"Micrófono","valor":"Sí"},{"etiqueta":"Controlador","valor":"Sí"},{"etiqueta":"Dimensiones","valor":"118 × 22 × 12 cm aprox."},{"etiqueta":"Montaje","valor":"Sobre el techo del vehículo"},{"etiqueta":"Incluye","valor":"Barra LED, controlador, micrófono, sirena y soportes de instalación"}]'
),

('SK-KFOZ02-BK', 'interior-y-confort', 'Organización y Practicidad', 'Organizador de Maletera Plegable', 'SKY', null,
 '/images/productos/SK-KFOZ02-BK-1.webp',
 '["/images/productos/SK-KFOZ02-BK-2.webp","/images/productos/SK-KFOZ02-BK-3.webp","/images/productos/SK-KFOZ02-BK-4.webp","/images/productos/SK-KFOZ02-BK-5.webp","/images/productos/SK-KFOZ02-BK-6.webp"]',
 'El espacio de tu maletera también puede estar mejor organizado. Con el organizador plegable mantienes tus herramientas, accesorios de auxilio vehicular y otros artículos reunidos en un solo lugar, evitando que estén sueltos en la maletera. Se arma fácilmente cuando lo necesitas y se pliega hasta quedar plano para guardarlo. Más orden, más practicidad y menos objetos sueltos en tu maletera.',
 false, null,
 '[{"etiqueta":"Modelo","valor":"KFO Z02-BK"},{"etiqueta":"Color","valor":"Negro"},{"etiqueta":"Dimensiones armado","valor":"38 × 30 × 28,5 cm"},{"etiqueta":"Diseño","valor":"Plegable, queda plano para guardarlo"},{"etiqueta":"Tapa","valor":"Con cierre metálico"},{"etiqueta":"Asas","valor":"Laterales, para manipularlo y trasladarlo"},{"etiqueta":"Uso","valor":"Herramientas, auxilio vehicular y artículos de uso cotidiano"}]'
),

('SK-DWKEY1-C', 'electronica-y-tecnologia-vehicular', 'Sistemas de Seguridad', 'Control Remoto con Pantalla LED', 'SKY', null,
 '/images/productos/SK-DWKEY1-C-1.webp',
 '["/images/productos/SK-DWKEY1-C-2.webp","/images/productos/SK-DWKEY1-C-3.webp","/images/productos/SK-DWKEY1-C-4.webp","/images/productos/SK-DWKEY1-C-5.webp"]',
 'Control remoto con pantalla LCD, elegante, compacto y con varias funciones, aplicable a todas las llaves de auto con botón de encendido. Desbloquea el vehículo automáticamente al acercarte y lo bloquea al alejarte dentro de un determinado rango; también sube las lunas automáticamente al alejarte. Incluye función antipérdida para ubicar la llave y podómetro. Se instala en unos 10 minutos, sin desmontar el auto ni cortar cables. Batería de litio interna: mantener a menos de 50 °C. Protección IP65: evitar el polvo en exceso y el agua directa. Asegúrate de que las puertas estén cerradas al usar la función de bloqueo.',
 false, null,
 '[{"etiqueta":"Compatibilidad","valor":"Autos con llave de botón de encendido"},{"etiqueta":"Material","valor":"ABS"},{"etiqueta":"Colores disponibles","valor":"Rojo, azul, plateado y negro"},{"etiqueta":"Dimensiones","valor":"3,5 × 2,13 × 0,79 cm"},{"etiqueta":"Peso","valor":"0,1 kg"},{"etiqueta":"Funciones","valor":"Entrada sin llave, bloqueo automático, cierre de lunas, antipérdida, podómetro"},{"etiqueta":"Protección","valor":"IP65"},{"etiqueta":"Instalación","valor":"10 minutos, sin desmontar ni cortar cables"}]'
)

on conflict (sku) do nothing;

-- Foto de categoría enviada por el cliente ("FOTOS PORTADA PAG WEB/PARA
-- CATEGORIAS FOTOS PRINCIPALES/TECNOLOGIA Y ELECTRONICA OK.jpg"). Solo si
-- todavía no tiene una cargada desde el admin. La de Tuning no necesita SQL:
-- se reemplazó el archivo al que ya apunta.
update categorias
set foto_url = '/images/categorias/electronica-y-tecnologia-vehicular.webp'
where slug = 'electronica-y-tecnologia-vehicular' and foto_url is null;
