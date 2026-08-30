import type { NextAuthConfig } from "next-auth";
import type { Rol } from "./types";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const rol = auth?.user?.rol;
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

      if (path === "/login") {
        if (isLoggedIn) {
          return Response.redirect(
            new URL(rol === "Admin" ? "/" : "/mi-fichaje", nextUrl)
          );
        }
        return true;
      }

      if (!isLoggedIn) return false;

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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.rol = token.rol as Rol;
        session.user.employeeId = (token.employeeId as string | null) ?? null;
      }
      return session;
    },
  },
};
