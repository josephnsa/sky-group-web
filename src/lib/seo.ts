// Datos estructurados (schema.org, JSON-LD) para buscadores: el negocio, cada
// producto y la ruta de navegación. Google los usa para mostrar la tienda con
// dirección, teléfono y horario, y los productos con foto, marca y precio.
import { NEGOCIO, SITE } from "../consts";
import { configuracionSitio as c } from "../data/configuracion";

export const absoluta = (ruta: string) => new URL(ruta, SITE.url).href;

/** Recorta un texto a ~160 caracteres sin cortar palabras (para meta description). */
export function resumen(texto: string, max = 160) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, limpio.lastIndexOf(" ", max - 1)).replace(/[,.;:]$/, "") + "…";
}

export function negocioJsonLd() {
  const redes = [c.facebook, c.instagram, c.tiktok, c.youtube].filter((r): r is string => Boolean(r));
  return {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    "@id": absoluta("/#negocio"),
    name: SITE.nombre,
    legalName: NEGOCIO.razonSocial,
    taxID: NEGOCIO.ruc,
    description: SITE.descripcion,
    url: SITE.url,
    logo: absoluta("/icons/icon-512.png"),
    image: absoluta("/images/og/sky-group.jpg"),
    telephone: `+${c.whatsappNumero}`,
    email: c.correo,
    priceRange: "S/",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. México 1028",
      addressLocality: "La Victoria",
      addressRegion: "Lima",
      addressCountry: "PE",
    },
    areaServed: { "@type": "Country", name: "Perú" },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "17:00" },
    ],
    hasMap: NEGOCIO.mapsUrl,
    ...(redes.length ? { sameAs: redes } : {}),
  };
}

export function sitioJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.nombre,
    url: SITE.url,
    inLanguage: "es-PE",
    publisher: { "@id": absoluta("/#negocio") },
  };
}

/** Ruta de navegación: [["Inicio", "/"], ["Catálogo", "/catalogo/"], ...] */
export function migasJsonLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([nombre, ruta], i) => ({ "@type": "ListItem", position: i + 1, name: nombre, item: absoluta(ruta) })),
  };
}

interface ProductoSeo {
  sku: string;
  nombre: string;
  marca: string;
  descripcion: string;
  precio: number | null;
}

export function productoJsonLd(p: ProductoSeo, imagenes: string[], marcaVisible: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    sku: p.sku,
    mpn: p.sku,
    image: imagenes.map(absoluta),
    ...(p.descripcion ? { description: resumen(p.descripcion, 500) } : {}),
    ...(marcaVisible ? { brand: { "@type": "Brand", name: marcaVisible } } : {}),
    url: absoluta(`/producto/${p.sku}/`),
    ...(p.precio != null
      ? {
          offers: {
            "@type": "Offer",
            price: p.precio.toFixed(2),
            priceCurrency: "PEN",
            url: absoluta(`/producto/${p.sku}/`),
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": absoluta("/#negocio") },
          },
        }
      : {}),
  };
}
