import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByUsername } from "@/lib/auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        if (!username || !password) return null;

        console.log("[auth] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING");
        console.log("[auth] SERVICE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING");

        let user;
        try {
          user = await getUserByUsername(username);
        } catch (e) {
          console.error("[auth] getUserByUsername error:", e);
          return null;
        }
        console.log("[auth] user found:", !!user);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        console.log("[auth] password valid:", valid);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          jerseyNumber: user.jersey_number,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
        token.jerseyNumber = (user as any).jerseyNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      (session.user as any).username = token.username;
      (session.user as any).jerseyNumber = token.jerseyNumber;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
