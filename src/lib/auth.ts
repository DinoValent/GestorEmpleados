import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cache } from "react";
import { authConfig } from "./auth.config";
import { getUserByEmail } from "./notion";

const { handlers, signIn, signOut, auth: uncachedAuth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          rol: user.rol,
          employeeId: user.employeeId,
          empresaId: user.empresaId,
        };
      },
    }),
  ],
});

// Sin este cache(), cada llamada a auth() dentro del mismo request (proxy,
// layout, page, componentes anidados) vuelve a decodificar el JWT desde cero.
export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut };
