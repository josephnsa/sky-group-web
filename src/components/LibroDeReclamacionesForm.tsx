import { useState } from "preact/hooks";
import { enviarReclamo, type DatosReclamo } from "../lib/reclamos";

type Estado = "idle" | "enviando" | "ok" | "error";

export default function LibroDeReclamacionesForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [codigoReclamo, setCodigoReclamo] = useState<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const datos = Object.fromEntries(new FormData(form).entries()) as unknown as DatosReclamo;

    setEstado("enviando");
    try {
      const codigo = await enviarReclamo(datos);
      setCodigoReclamo(codigo);
      setEstado("ok");
      form.reset();
    } catch (err) {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div class="rounded-lg border border-green-300 bg-green-50 p-6 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        <p class="font-semibold">Tu reclamo fue registrado correctamente.</p>
        <p class="mt-1 text-sm">
          Código de reclamo: <strong>{codigoReclamo}</strong>
        </p>
        <p class="mt-1 text-sm">
          Nos pondremos en contacto contigo dentro del plazo establecido por ley.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <fieldset class="space-y-3">
        <legend class="font-semibold text-neutral-900 dark:text-white">Tipo</legend>
        <div class="flex gap-6">
          <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input type="radio" name="tipo" value="reclamo" required /> Reclamo
          </label>
          <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input type="radio" name="tipo" value="queja" /> Queja
          </label>
        </div>
      </fieldset>

      <fieldset class="grid gap-4 sm:grid-cols-2">
        <legend class="col-span-2 font-semibold text-neutral-900 dark:text-white">
          Datos del consumidor
        </legend>
        <Campo label="Nombre completo" name="nombre" required />
        <Campo label="DNI / Carné de extranjería" name="documento" required />
        <Campo label="Domicilio" name="domicilio" required class="sm:col-span-2" />
        <Campo label="Teléfono" name="telefono" type="tel" required />
        <Campo label="Correo electrónico" name="correo" type="email" required />
        <Campo
          label="Si eres menor de edad: nombre y DNI del padre/madre/apoderado"
          name="apoderado"
          class="sm:col-span-2"
        />
      </fieldset>

      <fieldset class="grid gap-4 sm:grid-cols-2">
        <legend class="col-span-2 font-semibold text-neutral-900 dark:text-white">
          Datos del bien contratado
        </legend>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tipo de bien
          </label>
          <select
            name="tipoBien"
            required
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
        <Campo
          label="Descripción del producto/pedido"
          name="descripcionBien"
          class="sm:col-span-2"
          required
        />
        <Campo label="Monto reclamado (S/, opcional)" name="monto" type="number" />
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="font-semibold text-neutral-900 dark:text-white">
          Detalle del reclamo o queja
        </legend>
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Detalle</label>
          <textarea
            name="detalle"
            required
            rows={4}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Pedido del consumidor
          </label>
          <textarea
            name="pedido"
            required
            rows={3}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </fieldset>

      {estado === "error" && (
        <p class="text-sm text-red-600 dark:text-red-400">
          Ocurrió un error al enviar tu reclamo. Intenta nuevamente o escríbenos
          directamente.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        class="rounded-md bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {estado === "enviando" ? "Enviando..." : "Enviar reclamo"}
      </button>
    </form>
  );
}

interface CampoProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  class?: string;
}

function Campo({ label, name, type = "text", required, class: className }: CampoProps) {
  return (
    <div class={className}>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </div>
  );
}
