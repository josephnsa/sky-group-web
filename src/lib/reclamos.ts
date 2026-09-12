import { supabase } from "./supabase";

export interface DatosReclamo {
  tipo: string;
  nombre: string;
  documento: string;
  domicilio: string;
  telefono: string;
  correo: string;
  apoderado?: string;
  tipoBien: string;
  descripcionBien: string;
  monto?: string;
  detalle: string;
  pedido: string;
}

// Forma real de una fila en Supabase (columnas en snake_case) — distinta a
// `DatosReclamo`, que es el shape del formulario (camelCase, viene de
// FormData). No se derivan una de la otra a propósito, para no arrastrar
// nombres de campo equivocados de un lado al otro.
export interface Reclamo {
  id: string;
  codigo: string;
  tipo: string;
  nombre: string;
  documento: string;
  domicilio: string;
  telefono: string;
  correo: string;
  apoderado: string | null;
  tipo_bien: string;
  descripcion_bien: string;
  monto: number | null;
  detalle: string;
  pedido: string;
  estado: "pendiente" | "atendido";
  creado_en: string;
}

// Código generado acá (no por la base de datos) — un visitante anónimo no
// tiene permiso de leer de vuelta la fila que acaba de insertar (ver RLS en
// docs/migracion-reclamos-supabase.sql), así que el código tiene que
// conocerse ANTES del insert para poder mostrárselo de inmediato.
function generarCodigo(): string {
  const fecha = new Date();
  const marca =
    fecha.getFullYear().toString() +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0") +
    "-" +
    String(fecha.getHours()).padStart(2, "0") +
    String(fecha.getMinutes()).padStart(2, "0") +
    String(fecha.getSeconds()).padStart(2, "0");
  const azar = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `REC-${marca}-${azar}`;
}

// Envía un reclamo/queja nuevo. Devuelve el código de seguimiento que hay
// que mostrarle al cliente — la ley exige entregarlo de inmediato.
export async function enviarReclamo(datos: DatosReclamo): Promise<string> {
  const codigo = generarCodigo();
  const { error } = await supabase.from("reclamos").insert({
    codigo,
    tipo: datos.tipo,
    nombre: datos.nombre,
    documento: datos.documento,
    domicilio: datos.domicilio,
    telefono: datos.telefono,
    correo: datos.correo,
    apoderado: datos.apoderado || null,
    tipo_bien: datos.tipoBien,
    descripcion_bien: datos.descripcionBien,
    monto: datos.monto ? Number(datos.monto) : null,
    detalle: datos.detalle,
    pedido: datos.pedido,
  });
  if (error) throw error;
  return codigo;
}

export const reclamosAdmin = {
  async listar(): Promise<Reclamo[]> {
    const { data, error } = await supabase
      .from("reclamos")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return data;
  },
  async marcarEstado(id: string, estado: "pendiente" | "atendido") {
    const { error } = await supabase.from("reclamos").update({ estado }).eq("id", id);
    if (error) throw error;
  },
};
