// Genera una miniatura (webp) de la primera página de un PDF, en el propio
// navegador, con pdf.js — así el admin no tiene que crear la imagen de
// portada a mano al subir un catálogo nuevo.
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function generarMiniaturaPdf(archivo: File): Promise<File> {
  const buffer = await archivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pagina = await pdf.getPage(1);
  const viewport = pagina.getViewport({ scale: 1.5 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("No se pudo crear el contexto de canvas para la miniatura.");

  await pagina.render({ canvasContext: contexto, viewport, canvas }).promise;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar la miniatura."))), "image/webp", 0.82);
  });

  return new File([blob], "portada.webp", { type: "image/webp" });
}
