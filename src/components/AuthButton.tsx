import { useEffect, useRef, useState } from "preact/hooks";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { iniciarSincronizacionCarrito } from "../lib/cart-sync";
import { estadoDeAcceso } from "../lib/supabase-admin";
import { IconUser, IconChevronDown } from "./icons/ui";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    iniciarSincronizacionCarrito();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Se consulta aparte (no en el mismo efecto de arriba) porque depende de
  // `user`, que recién existe después del primer chequeo de sesión. Usa el
  // mismo `estadoDeAcceso()` compartido con el panel de admin (en vez de una
  // consulta propia) para no tener dos lugares que puedan quedar
  // desincronizados si el esquema de `admins` vuelve a cambiar.
  useEffect(() => {
    if (!user) {
      setEsAdmin(false);
      return;
    }
    estadoDeAcceso().then((estado) => setEsAdmin(estado === "admin"));
  }, [user]);

  // Cierra el menú al hacer clic afuera — mismo patrón que el mega-menu de
  // categorías del Header, pero en Preact (useEffect en vez de un listener
  // global en Layout.astro) porque este estado vive en la propia isla.
  useEffect(() => {
    if (!menuAbierto) return;
    function alHacerClicAfuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("click", alHacerClicAfuera);
    return () => document.removeEventListener("click", alHacerClicAfuera);
  }, [menuAbierto]);

  function iniciarSesion() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });
  }

  function cerrarSesion() {
    supabase.auth.signOut();
    setMenuAbierto(false);
  }

  if (cargando) {
    return <div class="h-9 w-9 sm:w-24" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={iniciarSesion}
        class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/15 hover:text-white"
      >
        <IconUser class="h-5 w-5" />
        <span class="hidden sm:inline">Iniciar sesión</span>
      </button>
    );
  }

  const nombre = user.user_metadata?.full_name ?? user.email ?? "Mi cuenta";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div class="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setMenuAbierto((v) => !v)}
        aria-expanded={menuAbierto}
        class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-white/15"
      >
        {avatar ? (
          <img src={avatar} alt="" class="h-8 w-8 rounded-full ring-2 ring-white/40" referrerpolicy="no-referrer" />
        ) : (
          <IconUser class="h-6 w-6 text-white" />
        )}
        <span class="hidden max-w-[8rem] truncate text-sm font-medium text-white sm:inline" title={nombre}>
          {nombre}
        </span>
        <IconChevronDown class={`hidden h-3.5 w-3.5 text-white/80 transition-transform duration-200 sm:block ${menuAbierto ? "rotate-180" : ""}`} />
      </button>

      {menuAbierto && (
        <div class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {esAdmin && (
            <a
              href="/admin"
              class="block px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 hover:bg-brand-blue/10 hover:text-brand-blue-dark dark:text-neutral-300 dark:hover:bg-brand-blue/20 dark:hover:text-brand-blue"
            >
              Panel de administración
            </a>
          )}
          <button
            type="button"
            onClick={cerrarSesion}
            class="block w-full px-4 py-2 text-left text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
