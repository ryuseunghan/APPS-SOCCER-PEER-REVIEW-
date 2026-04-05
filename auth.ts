// Design Ref: §7 — email 필드 기반 Credentials Provider
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          jerseyNumber: user.jersey_number,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.jerseyNumber = (user as any).jerseyNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      (session.user as any).jerseyNumber = token.jerseyNumber;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
