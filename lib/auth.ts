// in auth.ts

import { NextAuthOptions, getServerSession } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/app/schema/users";
import { eq } from "drizzle-orm";

const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    // ...add more providers here
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email!))
        .then((rows) => rows[0]);
      if (!existingUser) {
        await db.insert(users).values({
          email: user.email!,
          name: user.name || "",
        });
      }

      return true;
    },
  },
  secret: process.env.JWT_SECRET,
};

/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };
