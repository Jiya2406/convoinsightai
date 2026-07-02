import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Strategy: JWT sessions with a Credentials provider (email + password) backed
 * by our own User table. We intentionally do NOT use the Prisma adapter because
 * JWT sessions don't require DB-stored sessions — this keeps the schema clean
 * (no Account/Session/VerificationToken tables) which is ideal for the MVP.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id + role on the JWT at sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Expose id + role on the session for the app to consume.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as RoleName;
      }
      return session;
    },
  },
});
