import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import { configuracionAdmin, subirImagen, type ConfiguracionSitio } from "../../lib/supabase-admin";

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
  envios_texto: "",
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

function aFormulario(c: ConfiguracionSitio) {
  return {
    telefono: c.telefono ?? "",
    correo: c.correo ?? "",
    direccion: c.direccion ?? "",
    horario: c.horario ?? "",
    whatsapp_numero: c.whatsapp_numero ?? "",
    facebook: c.facebook ?? "",
    instagram: c.instagram ?? "",
    tiktok: c.tiktok ?? "",
    youtube: c.youtube ?? "",
    mision: c.mision ?? "",
    vision: c.vision ?? "",
    historia: c.historia ?? "",
    medios_pago: (c.medios_pago ?? []).join("\n"),
    envios_texto: c.envios_texto ?? "",
    atencion_mayorista_texto: c.atencion_mayorista_texto ?? "",
    atencion_tienda_youtube: c.atencion_tienda_youtube ?? "",
    atencion_mayorista_youtube: c.atencion_mayorista_youtube ?? "",
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
  const [enviosImagen1Actual, setEnviosImagen1Actual] = useState<string | null>(null);
  const [enviosImagen2Actual, setEnviosImagen2Actual] = useState<string | null>(null);
  const [archivoEnvios1, setArchivoEnvios1] = useState<File | null>(null);
  const [archivoEnvios2, setArchivoEnvios2] = useState<File | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const c = await configuracionAdmin.obtener();
      if (c) {
        setForm(aFormulario(c));
        setLogoActual(c.logo_url);
        setFachadaActual(c.foto_fachada_url);
        setValores(valoresAFormulario(c.valores));
        setEnviosImagen1Actual(c.envios_imagen_1);
        setEnviosImagen2Actual(c.envios_imagen_2);
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
        envios_texto: form.envios_texto.trim() || null,
        atencion_mayorista_texto: form.atencion_mayorista_texto.trim() || null,
        atencion_tienda_youtube: form.atencion_tienda_youtube.trim() || null,
        atencion_mayorista_youtube: form.atencion_mayorista_youtube.trim() || null,
      };
      if (archivoLogo) cambios.logo_url = await subirImagen(archivoLogo, "configuracion");
      if (archivoFachada) cambios.foto_fachada_url = await subirImagen(archivoFachada, "configuracion");
      if (archivoEnvios1) cambios.envios_imagen_1 = await subirImagen(archivoEnvios1, "configuracion");
      if (archivoEnvios2) cambios.envios_imagen_2 = await subirImagen(archivoEnvios2, "configuracion");

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
      setArchivoEnvios1(null);
      setArchivoEnvios2(null);
      setGuardado(true);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
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
    <form onSubmit={guardar} class="max-w-2xl space-y-6">
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Estos datos aparecen en el pie de página (footer) de todo el sitio. Un cambio acá
        requiere volver a publicar el sitio para que se vea en vivo, igual que con
        productos y categorías.
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <CampoTexto label="Teléfono" value={form.telefono} onInput={(v) => campo("telefono", v)} />
        <CampoTexto label="Correo" value={form.correo} onInput={(v) => campo("correo", v)} type="email" />
        <CampoTexto label="WhatsApp (solo números, con código de país)" value={form.whatsapp_numero} onInput={(v) => campo("whatsapp_numero", v)} />
      </div>

      <CampoTexto label="Dirección" value={form.direccion} onInput={(v) => campo("direccion", v)} />
      <CampoTexto label="Horario de atención" value={form.horario} onInput={(v) => campo("horario", v)} />

      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Redes sociales</p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Dejá el campo vacío para que ese enlace no se muestre en el footer.</p>
        <div class="mt-2 grid gap-4 sm:grid-cols-2">
          <CampoTexto label="Facebook" value={form.facebook} onInput={(v) => campo("facebook", v)} />
          <CampoTexto label="Instagram" value={form.instagram} onInput={(v) => campo("instagram", v)} />
          <CampoTexto label="TikTok" value={form.tiktok} onInput={(v) => campo("tiktok", v)} />
          <CampoTexto label="YouTube" value={form.youtube} onInput={(v) => campo("youtube", v)} />
        </div>
      </div>

      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Página "Nosotros"</p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Dejá un campo vacío para mantener el texto actual del sitio.</p>
        <div class="mt-2 space-y-4">
          <CampoTextarea label="Misión" value={form.mision} onInput={(v) => campo("mision", v)} />
          <CampoTextarea label="Visión" value={form.vision} onInput={(v) => campo("vision", v)} />
          <CampoTextarea label="Nuestra historia" value={form.historia} onInput={(v) => campo("historia", v)} />
          <div>
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Valores</label>
              <button
                type="button"
                onClick={agregarValor}
                class="text-sm text-brand-blue-dark transition-colors duration-200 hover:underline dark:text-brand-blue"
              >
                + Agregar valor
              </button>
            </div>
            {valores.length === 0 && (
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Sin editar todavía — el sitio muestra los 5 valores actuales por defecto. Agregá uno para empezar a personalizarlos.
              </p>
            )}
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => actualizarValor(i, { archivo: (e.target as HTMLInputElement).files?.[0] ?? null })}
                      class="mt-1 w-16 text-xs text-neutral-500"
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
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Medios de pago (uno por línea)
        </label>
        <textarea
          rows={4}
          placeholder={"Yape\nPlin\nTransferencia bancaria"}
          value={form.medios_pago}
          onInput={(e) => campo("medios_pago", (e.target as HTMLTextAreaElement).value)}
          class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Página "Atención por WhatsApp"</p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Enlaces de YouTube (pegá la URL normal, ej. https://www.youtube.com/watch?v=...) y texto de atención al por mayor.</p>
        <div class="mt-2 space-y-3">
          <CampoTexto label="Video: Atención en tienda" value={form.atencion_tienda_youtube} onInput={(v) => campo("atencion_tienda_youtube", v)} />
          <CampoTexto label="Video: Atención al por mayor" value={form.atencion_mayorista_youtube} onInput={(v) => campo("atencion_mayorista_youtube", v)} />
          <CampoTextarea label="Texto de atención al por mayor" value={form.atencion_mayorista_texto} onInput={(v) => campo("atencion_mayorista_texto", v)} />
        </div>
      </div>

      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Página "Envíos a todo el Perú"</p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Dejá el texto vacío para mantener el texto actual del sitio.</p>
        <div class="mt-2 space-y-3">
          <CampoTextarea label="Detalle de envíos" value={form.envios_texto} onInput={(v) => campo("envios_texto", v)} />
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Imagen 1 (opcional)</label>
              {enviosImagen1Actual && <img src={enviosImagen1Actual} alt="" class="mt-1 h-20 w-full rounded-md object-cover" />}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoEnvios1((e.target as HTMLInputElement).files?.[0] ?? null)}
                class="mt-1 block w-full text-xs text-neutral-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Imagen 2 (opcional)</label>
              {enviosImagen2Actual && <img src={enviosImagen2Actual} alt="" class="mt-1 h-20 w-full rounded-md object-cover" />}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoEnvios2((e.target as HTMLInputElement).files?.[0] ?? null)}
                class="mt-1 block w-full text-xs text-neutral-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="logo-footer">
            Logo del footer (opcional — dejá vacío para mantener el actual)
          </label>
          {logoActual && <img src={logoActual} alt="" class="mt-2 h-9 w-auto rounded bg-neutral-900 p-1" />}
          <input
            id="logo-footer"
            type="file"
            accept="image/*"
            onChange={(e) => setArchivoLogo((e.target as HTMLInputElement).files?.[0] ?? null)}
            class="mt-2 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recomendado: PNG con fondo transparente, versión blanca del logo (el footer es oscuro).
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="fachada-footer">
            Foto de fachada (opcional — dejá vacío para mantener la actual)
          </label>
          {fachadaActual && <img src={fachadaActual} alt="" class="mt-2 h-16 w-full rounded object-cover" />}
          <input
            id="fachada-footer"
            type="file"
            accept="image/*"
            onChange={(e) => setArchivoFachada((e.target as HTMLInputElement).files?.[0] ?? null)}
            class="mt-2 block w-full text-sm text-neutral-700 dark:text-neutral-300"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recomendado: horizontal (~3:1), buena luz — se muestra recortada como banda.
          </p>
        </div>
      </div>

      {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {guardado && !error && <p class="text-sm text-green-700 dark:text-green-400">Guardado correctamente.</p>}

      <button
        type="submit"
        disabled={guardando}
        class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

interface CampoTextoProps {
  label: string;
  value: string;
  onInput: (valor: string) => void;
  type?: string;
}

function CampoTextarea({ label, value, onInput }: Omit<CampoTextoProps, "type">) {
  return (
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <textarea
        rows={3}
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
