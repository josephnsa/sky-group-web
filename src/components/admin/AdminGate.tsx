import { useEffect, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { estadoDeAcceso } from "../../lib/supabase-admin";

// Compartido por las 3 islas del panel (carrusel/categorías/productos): sin
// sesión iniciada, o con sesión pero sin fila en `admins`, se redirige a
// Home de inmediato en vez de mostrar el formulario o cualquier mensaje acá
// mismo — no hay razón para dejar a alguien "parado" en una URL de admin a
// la que no tiene acceso. Esto es solo UX; la seguridad real la hacen las
// políticas RLS de Supabase (cualquier escritura de alguien sin fila en
// `admins` es rechazada aunque manipule el navegador — ver verificación en
// docs/panel-administracion.md).
export default function AdminGate({ children }: { children: ComponentChildren }) {
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    estadoDeAcceso().then((estado) => {
      if (estado === "admin") {
        setEsAdmin(true);
      } else {
        window.location.replace("/");
      }
    });
  }, []);

  if (!esAdmin) {
    return <p class="text-sm text-neutral-500 dark:text-neutral-400">Verificando acceso...</p>;
  }

  return <>{children}</>;
}
