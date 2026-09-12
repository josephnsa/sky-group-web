// Datos del negocio. Los campos marcados "TODO PENDIENTE" todavía faltan por
// confirmar — son obligatorios para el checkout de WhatsApp y para que el
// Libro de Reclamaciones Virtual cumpla con la norma de Indecopi.

export const SITE = {
  nombre: "SKY Group",
  // Redactado a partir de la presentación oficial: SKY Group distribuye
  // accesorios y equipamiento para vehículos (no repuestos mecánicos como
  // filtros/frenos, que era la categoría genérica que se había asumido
  // antes de tener esta información real).
  descripcion:
    "Accesorios y equipamiento para tu vehículo. Cotiza y compra por WhatsApp.",
  url: "https://sky.com.pe",
};

export const NEGOCIO = {
  razonSocial: "SKY GROUP SAC",
  ruc: "20600872606",
  direccion: "Av. México #1028, La Victoria, Lima, Perú",
  // Confirmado en "PRESENTACION SKY GROUP 2026.pptx" (diapositiva 17)
  mapsUrl: "https://share.google/GidL8kB6py4NJiXB9",
  telefono: "+51 950 486 811",
  correo: "administracion@sky.com.pe",
  // Número de WhatsApp para el checkout, formato internacional sin "+" ni espacios
  // (ej. 51987654321). Se usa para construir el enlace wa.me
  whatsappNumero: "51950486811",
};


// URLs confirmadas tal cual en "PRESENTACION SKY GROUP 2026.pptx" (diapositiva 9).
// No se incluyó YouTube en la presentación oficial, así que se deja vacío en vez
// de inferirlo (Footer.astro ya omite cualquier red con URL vacía).
export const REDES_SOCIALES = {
  facebook: "https://www.facebook.com/SKYGROUPSAC",
  instagram: "https://www.instagram.com/skygroupsac/",
  tiktok: "https://www.tiktok.com/@skygroupsac",
  youtube: "", // TODO PENDIENTE: no confirmado en la presentación oficial
};

export const MEDIOS_DE_PAGO = [
  "Yape",
  "Plin",
  "Transferencia bancaria",
  "Efectivo contra entrega",
]; // TODO: ajustar según lo que realmente acepte el negocio

export const SUCURSALES = [
  {
    nombre: "Tienda Principal",
    direccion: "Av. México #1028, La Victoria, Lima",
    // Confirmado en la presentación oficial (diapositiva 17)
    horario: "Lunes a viernes 9:00am - 6:00pm, sábados 9:00am - 5:00pm",
    telefono: NEGOCIO.telefono,
  },
]; // TODO: agregar más sucursales si aplica

// Marcas / líneas de producto que Sky Group distribuye (logos en
// public/images/brand/marcas/). Descripciones tal cual la presentación
// oficial (diapositiva 8). Se muestran en Nosotros y en Inicio.
export const MARCAS = [
  { nombre: "TACPRO", logo: "/images/brand/marcas/tacpro.png", desc: "Focos y faros LED de alta gama" },
  { nombre: "SKYLINE", logo: "/images/brand/marcas/skyline.png", desc: "Barras transversales, parrillas, porta equipajes y tapas de tolva" },
  { nombre: "SPORTS", logo: "/images/brand/marcas/sports.png", desc: "Accesorios tuning" },
]; // TODO: agregar más marcas si el negocio trabaja otras
