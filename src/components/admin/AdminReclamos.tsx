import { useEffect, useState } from "preact/hooks";
import AdminGate from "./AdminGate";
import { reclamosAdmin, type Reclamo } from "../../lib/reclamos";

export default function AdminReclamos() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  );
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUMNAS: { encabezado: string; obtener: (r: Reclamo) => string }[] = [
  { encabezado: "Código", obtener: (r) => r.codigo },
  { encabezado: "Fecha", obtener: (r) => formatearFecha(r.creado_en) },
  { encabezado: "Tipo", obtener: (r) => (r.tipo === "reclamo" ? "Reclamo" : "Queja") },
  { encabezado: "Estado", obtener: (r) => (r.estado === "pendiente" ? "Pendiente" : "Atendido") },
  { encabezado: "Nombre", obtener: (r) => r.nombre },
  { encabezado: "Documento", obtener: (r) => r.documento },
  { encabezado: "Domicilio", obtener: (r) => r.domicilio },
  { encabezado: "Teléfono", obtener: (r) => r.telefono },
  { encabezado: "Correo", obtener: (r) => r.correo },
  { encabezado: "Apoderado", obtener: (r) => r.apoderado ?? "" },
  { encabezado: "Tipo de bien", obtener: (r) => r.tipo_bien },
  { encabezado: "Descripción del bien", obtener: (r) => r.descripcion_bien },
  { encabezado: "Monto reclamado", obtener: (r) => (r.monto != null ? String(r.monto) : "") },
  { encabezado: "Detalle", obtener: (r) => r.detalle },
  { encabezado: "Pedido del consumidor", obtener: (r) => r.pedido },
];

// Una celda con coma, comilla o salto de línea rompe el CSV si no se
// envuelve entre comillas (y las comillas internas se duplican) — regla
// estándar del formato, no algo específico de Excel.
function celdaCsv(valor: string) {
  const necesitaComillas = /[";\n]/.test(valor);
  const escapado = valor.replace(/"/g, '""');
  return necesitaComillas ? `"${escapado}"` : escapado;
}

// Separador ";" (no ",") y BOM de UTF-8 al inicio — Excel en configuración
// regional de Perú/Latinoamérica interpreta la coma como separador decimal,
// así que un CSV con comas le entra todo en una sola columna; el BOM es
// necesario para que las tildes/ñ no salgan corruptas al abrir el archivo.
function descargarComoExcel(reclamos: Reclamo[]) {
  const encabezados = COLUMNAS.map((c) => celdaCsv(c.encabezado)).join(";");
  const filas = reclamos.map((r) => COLUMNAS.map((c) => celdaCsv(c.obtener(r))).join(";"));
  const contenido = "﻿" + [encabezados, ...filas].join("\r\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `reclamos-sky-group-${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function Panel() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [soloPendientes, setSoloPendientes] = useState(false);

  async function cargar() {
    setCargando(true);
    setReclamos(await reclamosAdmin.listar());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarEstado(r: Reclamo, estado: "pendiente" | "atendido") {
    await reclamosAdmin.marcarEstado(r.id, estado);
    await cargar();
  }

  const lista = soloPendientes ? reclamos.filter((r) => r.estado === "pendiente") : reclamos;
  const pendientes = reclamos.filter((r) => r.estado === "pendiente").length;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          {reclamos.length} reclamo{reclamos.length !== 1 && "s"} en total
          {pendientes > 0 && (
            <span class="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {pendientes} pendiente{pendientes !== 1 && "s"}
            </span>
          )}
        </p>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes((e.target as HTMLInputElement).checked)}
            />
            Solo pendientes
          </label>
          <button
            type="button"
            onClick={() => descargarComoExcel(lista)}
            disabled={lista.length === 0}
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Descargar Excel
          </button>
        </div>
      </div>

      {cargando ? (
        <p class="text-sm text-neutral-500">Cargando...</p>
      ) : lista.length === 0 ? (
        <p class="text-sm text-neutral-500 dark:text-neutral-400">No hay reclamos para mostrar.</p>
      ) : (
        <ul class="space-y-3">
          {lista.map((r) => {
            const expandido = abierto === r.id;
            return (
              <li
                key={r.id}
                class={`rounded-lg border p-4 ${
                  r.estado === "pendiente"
                    ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setAbierto(expandido ? null : r.id)}
                  class="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                >
                  <div>
                    <p class="font-semibold text-neutral-900 dark:text-neutral-100">
                      {r.codigo} · {r.tipo === "reclamo" ? "Reclamo" : "Queja"} de {r.nombre}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatearFecha(r.creado_en)} · {r.descripcion_bien}
                    </p>
                  </div>
                  <span
                    class={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
                      r.estado === "pendiente"
                        ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    {r.estado === "pendiente" ? "Pendiente" : "Atendido"}
                  </span>
                </button>

                {expandido && (
                  <div class="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
                    <p><span class="text-neutral-500 dark:text-neutral-400">Documento:</span> {r.documento}</p>
                    <p><span class="text-neutral-500 dark:text-neutral-400">Domicilio:</span> {r.domicilio}</p>
                    <p><span class="text-neutral-500 dark:text-neutral-400">Teléfono:</span> {r.telefono}</p>
                    <p><span class="text-neutral-500 dark:text-neutral-400">Correo:</span> {r.correo}</p>
                    {r.apoderado && (
                      <p><span class="text-neutral-500 dark:text-neutral-400">Apoderado:</span> {r.apoderado}</p>
                    )}
                    <p><span class="text-neutral-500 dark:text-neutral-400">Tipo de bien:</span> {r.tipo_bien}</p>
                    {r.monto && (
                      <p><span class="text-neutral-500 dark:text-neutral-400">Monto reclamado:</span> S/ {r.monto}</p>
                    )}
                    <p><span class="text-neutral-500 dark:text-neutral-400">Detalle:</span> {r.detalle}</p>
                    <p><span class="text-neutral-500 dark:text-neutral-400">Pedido del consumidor:</span> {r.pedido}</p>

                    <div class="pt-2">
                      {r.estado === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => marcarEstado(r, "atendido")}
                          class="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-blue-dark"
                        >
                          Marcar como atendido
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => marcarEstado(r, "pendiente")}
                          class="text-sm text-neutral-500 transition-colors duration-200 hover:underline dark:text-neutral-400"
                        >
                          Volver a pendiente
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
