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

        let user;
        let dbError: unknown = null;
        try {
          user = await getUserByUsername(username);
        } catch (e) {
          dbError = e;
        }
        console.log(
          `[auth-debug] url=${process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING"} key=${process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING"} user=${!!user} dbErr=${dbError ? String(dbError) : "none"}`
        );
        if (dbError || !user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        console.log(`[auth-debug] pwValid=${valid}`);
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
