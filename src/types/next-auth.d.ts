import { RoleName } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * Module augmentation so `session.user` carries our custom fields
 * (id + role) in a type-safe way across the app.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleName;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: RoleName;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleName;
  }
}
