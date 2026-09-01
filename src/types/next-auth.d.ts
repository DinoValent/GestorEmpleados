import type { Rol } from "@/lib/types";

declare module "next-auth" {
  interface User {
    rol: Rol;
    employeeId: string | null;
    empresaId: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      rol: Rol;
      employeeId: string | null;
      empresaId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol: Rol;
    employeeId: string | null;
    empresaId: string;
  }
}
