import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types.
 * Extends session with user id and keeps type safety.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * NextAuth configuration using Prisma + Credentials provider.
 */
export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("CREDENTIALS", credentials);
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findFirst({
          //change below line
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;
        //chage below line
        const isValid = await bcrypt.compare(
          "" + credentials.password,
          user.password,
        );
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? "",
      },
    }),
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
  },
};
