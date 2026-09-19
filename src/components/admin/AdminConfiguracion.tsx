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
};

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

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const c = await configuracionAdmin.obtener();
      if (c) {
        setForm(aFormulario(c));
        setLogoActual(c.logo_url);
        setFachadaActual(c.foto_fachada_url);
      } else {
        setNoMigrado(true);
      }
    } catch {
      setNoMigrado(true);
    }
    setCargando(false);
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
      };
      if (archivoLogo) cambios.logo_url = await subirImagen(archivoLogo, "configuracion");
      if (archivoFachada) cambios.foto_fachada_url = await subirImagen(archivoFachada, "configuracion");

      await configuracionAdmin.actualizar(cambios);
      setArchivoLogo(null);
      setArchivoFachada(null);
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
