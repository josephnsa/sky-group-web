// Categorías anteriores a la estructura del Excel del cliente
// (docs/migracion-categorias-excel.sql) -> categoría nueva que las reemplaza.
// La página de categoría genera una redirección solo para los slugs que ya
// no existen, así el sitio funciona igual antes y después de correr la
// migración (y si se revierte, las categorías viejas vuelven a mostrarse).
export const REDIRECCIONES_CATEGORIAS: Record<string, string> = {
  "4x4-off-road": "equipamiento-exterior",
  "electronica-y-tecnologia-vehicular": "interior-y-confort",
  "auxilio-vehicular": "seguridad-auxilio-y-remolque",
  remolque: "seguridad-auxilio-y-remolque",
  seguros: "seguridad-auxilio-y-remolque",
  "molduras-y-protectores": "tuning-y-personalizacion",
  "mantenimiento-y-herramientas": "cuidado-y-limpieza",
  "accesorios-tuning-y-decoracion": "tuning-y-personalizacion",
  "para-trabajo-y-negocio": "herramientas",
};
