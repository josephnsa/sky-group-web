import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import { configuracionAdmin, subirImagen, type ConfiguracionSitio } from "../../lib/supabase-admin";
import { SelectorArchivo, useAvisoBreve } from "./ui";
import { MEDIOS_DE_PAGO, NEGOCIO, REDES_SOCIALES, SUCURSALES } from "../../consts";
import {
  HISTORIA_DEFECTO,
  MISION_DEFECTO,
  TEXTO_MAYORISTA_DEFECTO,
  VALORES_DEFECTO,
  VIDEO_MAYORISTA_DEFECTO,
  VIDEO_TIENDA_DEFECTO,
  VISION_DEFECTO,
} from "../../data/textos-defecto";

const VACIO = {
  telefono: "",
  correo: "",
  direccion: "",
  horario: "",
  whatsapp_numero: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  mision: "",
  vision: "",
  historia: "",
  medios_pago: "",
  atencion_mayorista_texto: "",
  atencion_tienda_youtube: "",
  atencion_mayorista_youtube: "",
};

// Un valor en edición: texto controlado igual que el resto del form, más el
// archivo de imagen elegido (si lo hay) y la URL ya guardada (para mostrar
// la miniatura actual y no perderla si no se sube una nueva).
interface ValorEnEdicion {
  titulo: string;
  desc: string;
  imagenUrl: string | null;
  archivo: File | null;
}

function valoresAFormulario(valores: { titulo: string; desc: string; imagen?: string | null }[] | null): ValorEnEdicion[] {
  return (valores ?? []).map((v) => ({ titulo: v.titulo, desc: v.desc, imagenUrl: v.imagen ?? null, archivo: null }));
}

// Muestra en cada campo lo que la web muestra HOY: el valor guardado o, si está
// vacío, el texto por defecto que usa el sitio (mismas reglas que
// src/data/configuracion.ts y las páginas públicas).
function aFormulario(c: ConfiguracionSitio) {
  return {
    telefono: c.telefono || NEGOCIO.telefono,
    correo: c.correo || NEGOCIO.correo,
    direccion: c.direccion || SUCURSALES[0].direccion,
    horario: c.horario || SUCURSALES[0].horario,
    whatsapp_numero: c.whatsapp_numero || NEGOCIO.whatsappNumero,
    facebook: c.facebook ?? REDES_SOCIALES.facebook ?? "",
    instagram: c.instagram ?? REDES_SOCIALES.instagram ?? "",
    tiktok: c.tiktok ?? REDES_SOCIALES.tiktok ?? "",
    youtube: c.youtube ?? REDES_SOCIALES.youtube ?? "",
    mision: c.mision || MISION_DEFECTO,
    vision: c.vision || VISION_DEFECTO,
    historia: c.historia || HISTORIA_DEFECTO,
    medios_pago: (c.medios_pago?.length ? c.medios_pago : MEDIOS_DE_PAGO).join("\n"),
    atencion_mayorista_texto: c.atencion_mayorista_texto || TEXTO_MAYORISTA_DEFECTO,
    atencion_tienda_youtube: c.atencion_tienda_youtube || VIDEO_TIENDA_DEFECTO,
    atencion_mayorista_youtube: c.atencion_mayorista_youtube || VIDEO_MAYORISTA_DEFECTO,
  };
}

export default function AdminConfiguracion() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function Panel() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [noMigrado, setNoMigrado] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [logoActual, setLogoActual] = useState<string | null>(null);
  const [fachadaActual, setFachadaActual] = useState<string | null>(null);
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
  const [archivoFachada, setArchivoFachada] = useState<File | null>(null);
  const [valores, setValores] = useState<ValorEnEdicion[]>([]);
  const { avisar, aviso } = useAvisoBreve();

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const c = await configuracionAdmin.obtener();
      if (c) {
        setForm(aFormulario(c));
        setLogoActual(c.logo_url || "/images/brand/logo-blanco.png");
        setFachadaActual(c.foto_fachada_url || "/images/nosotros/fachada.webp");
        setValores(valoresAFormulario(c.valores?.length ? c.valores : VALORES_DEFECTO));
      } else {
        setNoMigrado(true);
      }
    } catch {
      setNoMigrado(true);
    }
    setCargando(false);
  }

  function agregarValor() {
    setValores((v) => [...v, { titulo: "", desc: "", imagenUrl: null, archivo: null }]);
  }
  function quitarValor(i: number) {
    setValores((v) => v.filter((_, idx) => idx !== i));
  }
  function actualizarValor(i: number, cambios: Partial<ValorEnEdicion>) {
    setValores((v) => v.map((val, idx) => (idx === i ? { ...val, ...cambios } : val)));
    setGuardado(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  function campo<K extends keyof typeof VACIO>(clave: K, valor: (typeof VACIO)[K]) {
    setForm((f) => ({ ...f, [clave]: valor }));
    setGuardado(false);
  }

  async function guardar(e: Event) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const cambios: Partial<ConfiguracionSitio> = {
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
        horario: form.horario.trim() || null,
        whatsapp_numero: form.whatsapp_numero.trim() || null,
        facebook: form.facebook.trim() || null,
        instagram: form.instagram.trim() || null,
        tiktok: form.tiktok.trim() || null,
        youtube: form.youtube.trim() || null,
        mision: form.mision.trim() || null,
        vision: form.vision.trim() || null,
        historia: form.historia.trim() || null,
        medios_pago: form.medios_pago.split("\n").map((m) => m.trim()).filter(Boolean) || null,
        atencion_mayorista_texto: form.atencion_mayorista_texto.trim() || null,
        atencion_tienda_youtube: form.atencion_tienda_youtube.trim() || null,
        atencion_mayorista_youtube: form.atencion_mayorista_youtube.trim() || null,
      };
      if (archivoLogo) cambios.logo_url = await subirImagen(archivoLogo, "configuracion");
      if (archivoFachada) cambios.foto_fachada_url = await subirImagen(archivoFachada, "configuracion");

      // Solo se suben las imágenes de valores que tienen un archivo nuevo
      // elegido — el resto conserva su URL ya guardada.
      const valoresConImagen = await Promise.all(
        valores
          .filter((v) => v.titulo.trim())
          .map(async (v) => ({
            titulo: v.titulo.trim(),
            desc: v.desc.trim(),
            imagen: v.archivo ? await subirImagen(v.archivo, "configuracion") : v.imagenUrl,
          })),
      );
      cambios.valores = valoresConImagen.length > 0 ? valoresConImagen : null;

      await configuracionAdmin.actualizar(cambios);
      setArchivoLogo(null);
      setArchivoFachada(null);
      setGuardado(true);
      await cargar();
      avisar("Configuración guardada. Se verá en la web en 1 a 2 minutos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      avisar("No se pudo guardar. Revisa el mensaje en rojo.", true);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p class="text-sm text-neutral-500">Cargando...</p>;

  if (noMigrado) {
    return (
      <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        Todavía falta correr <code>docs/migracion-configuracion-sitio.sql</code> en el SQL
        Editor de Supabase — sin eso, esta sección no tiene dónde guardar los datos.
      </div>
    );
  }

  return (
    <form onSubmit={guardar} class="max-w-3xl space-y-3">
      <p class="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        Cada sección muestra el texto que se ve hoy en la web. Abre la que necesites, cambia lo que quieras y pulsa
        <b> Guardar cambios</b>. Los cambios se ven en la web en 1 a 2 minutos.
      </p>

      <Seccion titulo="Datos de contacto" desc="Teléfono, correo, WhatsApp, dirección y horario. Aparecen en el pie de página y en Contacto." abierta>
        <div class="grid gap-4 sm:grid-cols-2">
          <CampoTexto label="Teléfono" value={form.telefono} onInput={(v) => campo("telefono", v)} />
          <CampoTexto label="Correo" value={form.correo} onInput={(v) => campo("correo", v)} type="email" />
          <CampoTexto label="WhatsApp (solo números, con código de país)" value={form.whatsapp_numero} onInput={(v) => campo("whatsapp_numero", v)} />
          <CampoTexto label="Horario de atención" value={form.horario} onInput={(v) => campo("horario", v)} />
        </div>
        <CampoTexto label="Dirección" value={form.direccion} onInput={(v) => campo("direccion", v)} />
      </Seccion>

      <Seccion titulo="Redes sociales" desc="Enlaces a Facebook, Instagram, TikTok y YouTube. Deja un campo vacío para ocultar ese ícono.">
        <div class="grid gap-4 sm:grid-cols-2">
          <CampoTexto label="Facebook" value={form.facebook} onInput={(v) => campo("facebook", v)} />
          <CampoTexto label="Instagram" value={form.instagram} onInput={(v) => campo("instagram", v)} />
          <CampoTexto label="TikTok" value={form.tiktok} onInput={(v) => campo("tiktok", v)} />
          <CampoTexto label="YouTube" value={form.youtube} onInput={(v) => campo("youtube", v)} />
        </div>
      </Seccion>

      <Seccion titulo={'Página "Nosotros"'} desc="Misión, visión, historia y valores de la empresa.">
        <CampoTextarea label="Misión" value={form.mision} onInput={(v) => campo("mision", v)} />
        <CampoTextarea label="Visión" value={form.vision} onInput={(v) => campo("vision", v)} />
        <CampoTextarea label="Nuestra historia" value={form.historia} onInput={(v) => campo("historia", v)} filas={6} />
        <div>
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Valores ({valores.length})</p>
            <button type="button" onClick={agregarValor} class="text-sm font-semibold text-brand-blue-dark hover:underline dark:text-brand-blue">
              + Agregar valor
            </button>
          </div>
            <div class="mt-2 space-y-3">
              {valores.map((v, i) => (
                <div key={i} class="flex gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                  <div class="shrink-0">
                    {(v.archivo ? URL.createObjectURL(v.archivo) : v.imagenUrl) ? (
                      <img
                        src={v.archivo ? URL.createObjectURL(v.archivo) : v.imagenUrl!}
                        alt=""
                        class="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div class="h-16 w-16 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                    )}
                    <label
                      for={`imagen-valor-${i}`}
                      class="mt-1 block w-16 cursor-pointer rounded bg-brand-blue py-1 text-center text-[11px] font-semibold text-white hover:bg-brand-blue-dark"
                    >
                      Cambiar
                    </label>
                    <input
                      id={`imagen-valor-${i}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => actualizarValor(i, { archivo: (e.target as HTMLInputElement).files?.[0] ?? null })}
                      class="sr-only"
                    />
                  </div>
                  <div class="min-w-0 flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Título (ej. Compromiso)"
                      value={v.titulo}
                      onInput={(e) => actualizarValor(i, { titulo: (e.target as HTMLInputElement).value })}
                      class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={v.desc}
                      onInput={(e) => actualizarValor(i, { desc: (e.target as HTMLInputElement).value })}
                      class="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarValor(i)}
                    class="shrink-0 self-start text-xs text-red-600 transition-colors duration-200 hover:underline dark:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
        </div>
      </Seccion>

      <Seccion titulo="Medios de pago" desc={'Los que aparecen en la página "Medios de pago". Uno por línea.'}>
        <textarea
          id="medios-pago"
          aria-label="Medios de pago, uno por línea"
          rows={4}
          value={form.medios_pago}
          onInput={(e) => campo("medios_pago", (e.target as HTMLTextAreaElement).value)}
          class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </Seccion>

      <Seccion titulo={'Página "Atención por WhatsApp"'} desc="Videos de YouTube (pega el enlace normal del video) y el texto de atención al por mayor.">
        <CampoTexto label="Video: Atención en tienda" value={form.atencion_tienda_youtube} onInput={(v) => campo("atencion_tienda_youtube", v)} />
        <CampoTexto label="Video: Atención al por mayor" value={form.atencion_mayorista_youtube} onInput={(v) => campo("atencion_mayorista_youtube", v)} />
        <CampoTextarea label="Texto de atención al por mayor" value={form.atencion_mayorista_texto} onInput={(v) => campo("atencion_mayorista_texto", v)} />
      </Seccion>

      <Seccion titulo="Logo y foto de la tienda" desc="El logo del pie de página y la foto de la fachada.">
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="min-w-0">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="logo-footer">
              Logo del pie de página
            </label>
            <SelectorArchivo
              id="logo-footer"
              accept="image/*"
              tipo="imagen"
              archivo={archivoLogo}
              onElegir={setArchivoLogo}
              actual={logoActual}
              clasePrevia="h-12 w-auto max-w-[10rem] bg-neutral-900 object-contain p-1"
            />
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">PNG con fondo transparente, versión blanca del logo (el pie de página es oscuro).</p>
          </div>
          <div class="min-w-0">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="fachada-footer">
              Foto de la fachada
            </label>
            <SelectorArchivo
              id="fachada-footer"
              accept="image/*"
              tipo="imagen"
              archivo={archivoFachada}
              onElegir={setArchivoFachada}
              actual={fachadaActual}
              clasePrevia="h-16 w-40 object-cover"
            />
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Horizontal (aprox. 3:1) y con buena luz.</p>
          </div>
        </div>
      </Seccion>

      <div class="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <button
          type="submit"
          disabled={guardando}
          class="rounded-md bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {guardado && !error && <p class="text-sm text-green-700 dark:text-green-400">Guardado correctamente.</p>}
      </div>
      {aviso}
    </form>
  );
}

/** Sección plegable de la configuración. */
function Seccion({ titulo, desc, abierta, children }: { titulo: string; desc: string; abierta?: boolean; children: ComponentChildren }) {
  return (
    <details open={abierta} class="group rounded-lg border border-neutral-200 bg-white open:shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span class="min-w-0">
          <span class="block font-semibold text-neutral-900 dark:text-white">{titulo}</span>
          <span class="block text-xs text-neutral-500 dark:text-neutral-400">{desc}</span>
        </span>
        <svg class="h-5 w-5 flex-none text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </summary>
      <div class="space-y-4 border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">{children}</div>
    </details>
  );
}

interface CampoTextoProps {
  label: string;
  value: string;
  onInput: (valor: string) => void;
  type?: string;
}

function CampoTextarea({ label, value, onInput, filas = 4 }: Omit<CampoTextoProps, "type"> & { filas?: number }) {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <textarea
        rows={filas}
        value={value}
        onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </div>
  );
}

function CampoTexto({ label, value, onInput, type = "text" }: CampoTextoProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <input
        type={type}
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </div>
  );
}
