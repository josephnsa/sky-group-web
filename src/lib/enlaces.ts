// Enlace del botón "¡Conoce más!" de la ficha de producto. Si es un video
// de TikTok o YouTube se puede reproducir dentro de la web, en un modal,
// con el reproductor oficial de cada plataforma (iframe); cualquier otro
// enlace se abre en una pestaña nueva.
export interface VideoEmbebido {
  plataforma: "TikTok" | "YouTube";
  embedUrl: string;
  vertical: boolean; // TikTok es 9:16, YouTube 16:9
}

export function videoEmbebible(url: string | null | undefined): VideoEmbebido | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "tiktok.com") {
    // https://www.tiktok.com/@cuenta/video/7512182481278242054?...
    const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
    if (id) return { plataforma: "TikTok", embedUrl: `https://www.tiktok.com/player/v1/${id}?embed_from=oembed&music_info=1&description=1&autoplay=1&rel=0`, vertical: true };
  }
  if (host === "youtube.com" || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/)?.[1];
    if (id) {
      const vertical = u.pathname.startsWith("/shorts/");
      return { plataforma: "YouTube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, vertical };
    }
  }
  return null;
}
