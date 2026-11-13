import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  numeroWhatsapp: string; // formato internacional sin "+" (ej. 51950486811)
}

const MAX_FOTOS = 6;
// CRLF: mismo criterio que lib/whatsapp.ts (WhatsApp de escritorio en
// Windows pierde los \n simples).
const SALTO = "\r\n";

const CLASE_INPUT =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const CLASE_LABEL = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

// Formulario "Solicitar garantía" (documento GARANTIAS - INFO OK.docx):
// el cliente completa sus datos, el producto y la falla, elige fotos, y se
// abre WhatsApp al número de garantías con la solicitud ya redactada.
// WhatsApp no permite adjuntar archivos desde un enlace wa.me, así que las
// fotos se previsualizan acá y, al enviar, se le indica al cliente que las
// adjunte en el mismo chat que se acaba de abrir.
export default function FormularioGarantia({ numeroWhatsapp }: Props) {
  const [datos, setDatos] = useState({
    nombre: "",
    telefono: "",
    documento: "",
    producto: "",
    comprobante: "",
    fechaCompra: "",
    falla: "",
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [avisoFotos, setAvisoFotos] = useState<string | null>(null);
  const confirmacionRef = useRef<HTMLDivElement>(null);

  // El formulario es más alto que el aviso que lo reemplaza: sin esto, el
  // aviso queda arriba de la pantalla, tapado por el header fijo.
  useEffect(() => {
    if (enviado) confirmacionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [enviado]);

  useEffect(() => {
    const urls = fotos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [fotos]);

  function campo(clave: keyof typeof datos, valor: string) {
    setDatos((d) => ({ ...d, [clave]: valor }));
  }

  function elegirFotos(lista: FileList | null) {
    const nuevas = Array.from(lista ?? []).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const todas = [...fotos, ...nuevas];
    setAvisoFotos(todas.length > MAX_FOTOS ? `Puedes elegir hasta ${MAX_FOTOS} archivos; se tomaron los primeros ${MAX_FOTOS}.` : null);
    setFotos(todas.slice(0, MAX_FOTOS));
  }

  function quitarFoto(i: number) {
    setFotos((f) => f.filter((_, j) => j !== i));
    setAvisoFotos(null);
  }

  function mensaje() {
    // null = campo opcional vacío (se omite); "" = línea en blanco a propósito.
    const lineas: (string | null)[] = [
      "Hola SKY Group, quiero solicitar la *revisión de garantía* de un producto:",
      "",
      `*Nombre:* ${datos.nombre.trim()}`,
      `*Teléfono:* ${datos.telefono.trim()}`,
      datos.documento.trim() ? `*DNI / RUC:* ${datos.documento.trim()}` : null,
      `*Producto (nombre o código):* ${datos.producto.trim()}`,
      datos.comprobante.trim() ? `*Comprobante de pago:* ${datos.comprobante.trim()}` : null,
      datos.fechaCompra ? `*Fecha de compra / recepción:* ${datos.fechaCompra.split("-").reverse().join("/")}` : null,
      "",
      "*Descripción de la falla:*",
      datos.falla.trim(),
      "",
      fotos.length > 0
        ? `Adjunto ${fotos.length} ${fotos.length === 1 ? "foto/video" : "fotos/videos"} del problema en este chat.`
        : "Puedo enviar fotos o videos del problema si los necesitan.",
    ];
    return lineas.filter((l): l is string => l !== null).join(SALTO);
  }

  function enviar(e: Event) {
    e.preventDefault();
    const url = `https://wa.me/${numeroWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje())}`;
    window.open(url, "_blank", "noopener");
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div ref={confirmacionRef} class="scroll-mt-40 rounded-lg border border-brand-green/40 bg-brand-green/10 p-5" role="status">
        <p class="font-semibold text-neutral-900 dark:text-white">Se abrió WhatsApp con tu solicitud</p>
        {fotos.length > 0 ? (
          <>
            <p class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
              Envía el mensaje y luego <b>adjunta en ese mismo chat</b>{" "}
              {fotos.length === 1 ? "la foto o video que elegiste" : `los ${fotos.length} archivos que elegiste`}. WhatsApp
              no permite adjuntarlos automáticamente desde la web.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              {previews.map((src, i) =>
                fotos[i]?.type.startsWith("video/") ? (
                  <span key={src} class="flex h-16 w-16 items-center justify-center rounded-md bg-neutral-900 text-xs text-white">
                    Video
                  </span>
                ) : (
                  <img key={src} src={src} alt={`Foto ${i + 1}`} class="h-16 w-16 rounded-md object-cover" />
                ),
              )}
            </div>
          </>
        ) : (
          <p class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Envía el mensaje. Si tienes fotos o videos del problema, adjúntalos en ese mismo chat: ayudan a evaluar tu
            caso más rápido.
          </p>
        )}
        <p class="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
          ¿No se abrió?{" "}
          <a
            href={`https://wa.me/${numeroWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje())}`}
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-brand-blue-dark underline dark:text-brand-blue"
          >
            Abrir WhatsApp
          </a>
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          class="mt-4 text-sm font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Editar la solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class={CLASE_LABEL} htmlFor="g-nombre">Nombre completo *</label>
        <input id="g-nombre" required autocomplete="name" value={datos.nombre} onInput={(e) => campo("nombre", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div>
        <label class={CLASE_LABEL} htmlFor="g-telefono">Teléfono / WhatsApp *</label>
        <input id="g-telefono" required type="tel" autocomplete="tel" inputMode="tel" placeholder="9XX XXX XXX" value={datos.telefono} onInput={(e) => campo("telefono", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div>
        <label class={CLASE_LABEL} htmlFor="g-documento">DNI o RUC</label>
        <input id="g-documento" inputMode="numeric" value={datos.documento} onInput={(e) => campo("documento", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div>
        <label class={CLASE_LABEL} htmlFor="g-producto">Producto (nombre o código) *</label>
        <input id="g-producto" required placeholder="Ej. Faja de remolque SK-TP005" value={datos.producto} onInput={(e) => campo("producto", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div>
        <label class={CLASE_LABEL} htmlFor="g-comprobante">N.° de boleta o factura</label>
        <input id="g-comprobante" placeholder="Ej. B001-000123" value={datos.comprobante} onInput={(e) => campo("comprobante", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div>
        <label class={CLASE_LABEL} htmlFor="g-fecha">Fecha de compra o recepción</label>
        <input id="g-fecha" type="date" value={datos.fechaCompra} onInput={(e) => campo("fechaCompra", (e.target as HTMLInputElement).value)} class={CLASE_INPUT} />
      </div>
      <div class="sm:col-span-2">
        <label class={CLASE_LABEL} htmlFor="g-falla">Describe la falla o inconveniente *</label>
        <textarea
          id="g-falla"
          required
          rows={4}
          placeholder="¿Qué pasó, desde cuándo y cómo se instaló o usó el producto?"
          value={datos.falla}
          onInput={(e) => campo("falla", (e.target as HTMLTextAreaElement).value)}
          class={CLASE_INPUT}
        />
      </div>
      <div class="sm:col-span-2">
        <label class={CLASE_LABEL} htmlFor="g-fotos">Fotos o videos del problema (hasta {MAX_FOTOS})</label>
        <input
          id="g-fotos"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => {
            elegirFotos((e.target as HTMLInputElement).files);
            (e.target as HTMLInputElement).value = "";
          }}
          class="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-blue-dark hover:file:bg-brand-blue/20 dark:text-neutral-300 dark:file:text-brand-blue"
        />
        {avisoFotos && <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">{avisoFotos}</p>}
        {fotos.length > 0 && (
          <ul class="mt-3 flex flex-wrap gap-2" aria-label="Archivos elegidos">
            {previews.map((src, i) => (
              <li key={src} class="relative">
                {fotos[i]?.type.startsWith("video/") ? (
                  <span class="flex h-20 w-20 items-center justify-center rounded-md bg-neutral-900 text-xs text-white">Video</span>
                ) : (
                  <img src={src} alt={`Foto ${i + 1}`} class="h-20 w-20 rounded-md object-cover ring-1 ring-black/10" />
                )}
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  aria-label={`Quitar archivo ${i + 1}`}
                  class="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white shadow hover:bg-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Al enviar se abrirá WhatsApp con tu solicitud ya redactada; ahí mismo adjuntas las fotos o videos.
        </p>
      </div>
      <div class="sm:col-span-2">
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44Zm8.04-17.48A11.29 11.29 0 0 0 12.04.7C5.77.7.67 5.8.67 12.07c0 2 .52 3.96 1.52 5.68L.57 23.7l6.08-1.6a11.33 11.33 0 0 0 5.39 1.37h.01c6.26 0 11.36-5.1 11.37-11.37a11.3 11.3 0 0 0-3.34-8.08Z" />
          </svg>
          Enviar solicitud por WhatsApp
        </button>
      </div>
    </form>
  );
}
