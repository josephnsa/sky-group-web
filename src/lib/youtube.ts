// Convierte cualquier URL real de YouTube (watch, youtu.be, shorts, ya
// embebida) al formato /embed/<id> que se puede meter en un <iframe>.
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
}
