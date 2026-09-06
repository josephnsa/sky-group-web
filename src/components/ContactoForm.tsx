import { useState } from "preact/hooks";
import { NEGOCIO } from "../consts";

// Sin backend propio: en vez de fingir un envío que no existe, el formulario
// arma un mailto: real (asunto + cuerpo ya redactados) y abre el programa de
// correo del visitante — funciona hoy mismo, sin depender de configurar nada.
export default function ContactoForm() {
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const datos = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const asunto = datos.asunto?.trim() || "Consulta desde la web";
    const cuerpo = `Nombre: ${datos.nombre}\nCorreo: ${datos.correo}\n\n${datos.mensaje}`;
    window.location.href = `mailto:${NEGOCIO.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setEnviado(true);
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Completa el formulario y se abrirá tu programa de correo con el mensaje ya redactado hacia {NEGOCIO.correo}, listo para enviar.
      </p>

      <Campo label="Nombre" name="nombre" required />
      <Campo label="Correo electrónico" name="correo" type="email" required />
      <Campo label="Asunto" name="asunto" />

      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="mensaje">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      {enviado && (
        <p class="text-sm text-green-700 dark:text-green-400">
          Se abrió tu programa de correo. Si no ves nada, escríbenos directo a {NEGOCIO.correo}.
        </p>
      )}

      <button
        type="submit"
        class="rounded-md bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
      >
        Enviar mensaje
      </button>
    </form>
  );
}

interface CampoProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}

function Campo({ label, name, type = "text", required }: CampoProps) {
  return (
    <div>
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
