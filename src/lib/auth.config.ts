import type { NextAuthConfig } from "next-auth";
import type { Rol } from "./types";

// Primer segmento de cada página real de la app. Cualquier URL que no matchee
// ninguno de estos (y no sea /api/*) se considera desconocida.
const KNOWN_ROUTES = new Set([
  "/",
  "/login",
  "/planes",
  "/perfil",
  "/mi-fichaje",
  "/empleados",
  "/asistencia",
  "/resumen-pagos",
  "/calendario",
  "/ausencias",
  "/turnos",
  "/reportes",
  "/usuarios",
  "/feriados",
  "/superadmin",
]);

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const rol = auth?.user?.rol;
      const isSuperAdmin = rol === "SuperAdmin";
      // Una sesión vieja (de antes de multi-empresa) puede traer un token sin
      // empresaId. Tratarla como "no logueada" evita que quede en un estado
      // roto a medias — el cliente cree que hay sesión, pero el servidor no
      // tiene con qué empresa trabajar. Así, cualquier ruta protegida la manda
      // directo a /login para reautenticarse y obtener un token nuevo. El
      // SuperAdmin es la única excepción: no pertenece a ninguna empresa.
      const isLoggedIn = !!auth?.user && (isSuperAdmin || !!auth.user.empresaId);
      const path = nextUrl.pathname;

      if (path.startsWith("/api/auth")) return true;

      // Allows the scheduled weekly-summary cron (no browser session) through,
      // but only with the matching secret — never bypassed if unset.
      if (path === "/api/reportes/weekly-summary") {
        const secret = process.env.CRON_SECRET;
        if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
          return true;
        }
      }

      // Cualquier URL que no sea una página conocida ni una ruta de API se manda
      // al inicio, sin importar si hay sesión o no.
      if (!path.startsWith("/api/")) {
        const topSegment = "/" + (path.split("/")[1] ?? "");
        if (!KNOWN_ROUTES.has(topSegment)) {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      if (path === "/login") {
        if (isLoggedIn) {
          const dest = isSuperAdmin ? "/superadmin" : rol === "Admin" ? "/" : "/mi-fichaje";
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      // "/" es la landing pública para quien no inició sesión; los ya logueados
      // ven su panel normal (Admin), son mandados a su propia pantalla (Empleado),
      // o al panel de gestión de clientes (SuperAdmin).
      if (path === "/") {
        if (!isLoggedIn) return true;
        if (isSuperAdmin) return Response.redirect(new URL("/superadmin", nextUrl));
        if (rol !== "Admin") {
          return Response.redirect(new URL("/mi-fichaje", nextUrl));
        }
        return true;
      }

      // "/planes" es pública: sirve para mostrarle precios a alguien antes de loguearse.
      if (path === "/planes") return true;

      if (!isLoggedIn) return false;

      // El panel de SuperAdmin es un árbol completamente aparte del de una
      // empresa (tenant): solo el SuperAdmin entra ahí, y el SuperAdmin no
      // usa ninguna otra ruta de la app.
      if (path.startsWith("/superadmin") || path.startsWith("/api/superadmin")) {
        return isSuperAdmin ? true : Response.redirect(new URL("/", nextUrl));
      }
      if (isSuperAdmin) return Response.redirect(new URL("/superadmin", nextUrl));

      if (path === "/mi-fichaje" || path.startsWith("/api/mi-fichaje")) {
        return true;
      }

      if (rol !== "Admin") {
        return Response.redirect(new URL("/mi-fichaje", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
        token.employeeId = user.employeeId;
        token.empresaId = user.empresaId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.rol = token.rol as Rol;
        session.user.employeeId = (token.employeeId as string | null) ?? null;
        session.user.empresaId = (token.empresaId as string | null) ?? null;
      }
      return session;
    },
  },
};
