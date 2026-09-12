import AdminGate from "./AdminGate";

export default function AdminInicio() {
  return (
    <AdminGate>
      <div class="grid gap-4 sm:grid-cols-2">
        <a
          href="/admin/carrusel"
          class="rounded-lg border border-neutral-200 p-5 text-center font-semibold text-neutral-900 transition-colors duration-200 hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-800 dark:text-white dark:hover:bg-brand-blue/10"
        >
          Carrusel
        </a>
        <a
          href="/admin/categorias"
          class="rounded-lg border border-neutral-200 p-5 text-center font-semibold text-neutral-900 transition-colors duration-200 hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-800 dark:text-white dark:hover:bg-brand-blue/10"
        >
          Categorías
        </a>
        <a
          href="/admin/productos"
          class="rounded-lg border border-neutral-200 p-5 text-center font-semibold text-neutral-900 transition-colors duration-200 hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-800 dark:text-white dark:hover:bg-brand-blue/10"
        >
          Productos
        </a>
        <a
          href="/admin/reclamos"
          class="rounded-lg border border-neutral-200 p-5 text-center font-semibold text-neutral-900 transition-colors duration-200 hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-800 dark:text-white dark:hover:bg-brand-blue/10"
        >
          Reclamos
        </a>
        <a
          href="/admin/administradores"
          class="rounded-lg border border-neutral-200 p-5 text-center font-semibold text-neutral-900 transition-colors duration-200 hover:border-brand-blue hover:bg-brand-blue/5 dark:border-neutral-800 dark:text-white dark:hover:bg-brand-blue/10"
        >
          Administradores
        </a>
      </div>
    </AdminGate>
  );
}
