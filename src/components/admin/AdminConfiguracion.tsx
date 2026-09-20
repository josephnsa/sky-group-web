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
  valores: "",
  medios_pago: "",
};

// [{titulo, desc}] <-> "Título: Descripción" por línea — mismo formato
// simple ya usado para la ficha técnica de productos (AdminProductos.tsx).
function valoresATexto(valores: { titulo: string; desc: string }[] | null) {
  return (valores ?? []).map((v) => `${v.titulo}: ${v.desc}`).join("\n");
}
function textoAValores(texto: string) {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lineas.length === 0) return null;
  return lineas.map((linea) => {
    const [titulo, ...resto] = linea.split(":");
    return { titulo: titulo.trim(), desc: resto.join(":").trim() };
  });
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
    valores: valoresATexto(c.valores),
    medios_pago: (c.medios_pago ?? []).join("\n"),
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
        mision: form.mision.trim() || null,
        vision: form.vision.trim() || null,
        historia: form.historia.trim() || null,
        valores: textoAValores(form.valores),
        medios_pago: form.medios_pago.split("\n").map((m) => m.trim()).filter(Boolean) || null,
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

      <div>
        <p class="text-sm font-semibold text-neutral-900 dark:text-white">Página "Nosotros"</p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">Dejá un campo vacío para mantener el texto actual del sitio.</p>
        <div class="mt-2 space-y-4">
          <CampoTextarea label="Misión" value={form.mision} onInput={(v) => campo("mision", v)} />
          <CampoTextarea label="Visión" value={form.vision} onInput={(v) => campo("vision", v)} />
          <CampoTextarea label="Nuestra historia" value={form.historia} onInput={(v) => campo("historia", v)} />
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Valores (uno por línea, formato "Título: Descripción")
            </label>
            <textarea
              rows={5}
              placeholder={"Compromiso: Nos involucramos con las necesidades de nuestros clientes.\nCalidad: ..."}
              value={form.valores}
              onInput={(e) => campo("valores", (e.target as HTMLTextAreaElement).value)}
              class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
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
