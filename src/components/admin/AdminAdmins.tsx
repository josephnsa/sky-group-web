import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import { adminsGestion, correoActual, type AdminUsuario } from "../../lib/supabase-admin";

export default function AdminAdmins() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" });
}

function Panel() {
  const [admins, setAdmins] = useState<AdminUsuario[]>([]);
  const [miCorreo, setMiCorreo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function cargar() {
    setCargando(true);
    const [lista, correo] = await Promise.all([adminsGestion.listar(), correoActual()]);
    setAdmins(lista);
    setMiCorreo(correo);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregar(e: Event) {
    e.preventDefault();
    if (!email.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await adminsGestion.agregar(email);
      setEmail("");
      await cargar();
    } catch (err) {
      // El correo ya podría estar en la lista (columna `email` es única).
      setError(err instanceof Error ? err.message : "Error al agregar.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(admin: AdminUsuario) {
    if (!confirm(`¿Quitar a ${admin.email} del rol de administrador?`)) return;
    try {
      await adminsGestion.quitar(admin.id);
      await cargar();
    } catch {
      alert("No se pudo quitar.");
    }
  }

  return (
    <div class="space-y-8">
      <form onSubmit={agregar} class="space-y-4 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 class="font-semibold text-neutral-900 dark:text-white">Agregar administrador</h2>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="email-admin">
            Correo de Google
          </label>
          <input
            id="email-admin"
            type="email"
            required
            placeholder="nombre@gmail.com"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            No hace falta que esa persona haya iniciado sesión antes — en cuanto entre con Google
            usando este mismo correo, va a tener acceso al panel automáticamente.
          </p>
        </div>

        {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          class="rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Agregar administrador"}
        </button>
      </form>

      <div>
        <h2 class="mb-3 font-semibold text-neutral-900 dark:text-white">Administradores actuales</h2>
        {cargando ? (
          <p class="text-sm text-neutral-500">Cargando...</p>
        ) : (
          <ul class="space-y-3">
            {admins.map((a) => {
              const esUnoMismo = miCorreo != null && a.email.toLowerCase() === miCorreo.toLowerCase();
              return (
                <li
                  key={a.id}
                  class="flex items-center gap-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-neutral-900 dark:text-neutral-100">
                      {a.email} {esUnoMismo && <span class="text-neutral-500 dark:text-neutral-400">(tú)</span>}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                      Agregado el {formatearFecha(a.creado_en)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(a)}
                    disabled={esUnoMismo}
                    title={esUnoMismo ? "No puedes quitarte a ti mismo — pídele a otro admin que lo haga" : undefined}
                    class="shrink-0 text-sm text-red-600 transition-colors duration-200 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline dark:text-red-400 dark:disabled:text-neutral-600"
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
