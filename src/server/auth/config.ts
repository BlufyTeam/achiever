import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client"; // 👈 for QueryMode.insensitive

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types.
 * Extends session with user id/role/username and keeps type safety.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      username?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "USER" | "ADMIN";
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
    username?: string;
  }
}

const adapter = PrismaAdapter(db) as Adapter;

/**
 * NextAuth configuration using Prisma + Credentials provider.
 */
export const authConfig: NextAuthOptions = {
  adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" }, // 👈 changed
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const identifier = credentials.identifier.trim();

        // Find by email (case-insensitive) OR by exact username
        const user = await db.user.findFirst({
          where: {
            OR: [
              {
                email: {
                  equals: identifier,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              { username: identifier },
            ],
          },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username, // 👈 include username in returned user
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).username; // 👈 persist username in JWT
      }
      return token;
    },
    async session({ session, token }) {
      // prefer token.id we set; fallback to token.sub
      session.user.id = (token as any).id ?? token.sub ?? "";
      session.user.role = token.role as "USER" | "ADMIN";
      (session.user as any).username = token.username as string | undefined; // 👈 expose username in session
      return session;
    },
  },
  pages: {
    signIn: "/login", // use custom login page
  },
};

export const getServerAuthSession = () => getServerSession(authConfig);
