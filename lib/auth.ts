import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { verifyTOTP } from "@/lib/totp";
import { decryptPlain } from "@/lib/encryption";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
        totpCode: { label: "קוד אימות", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });
        if (!user?.password) return null;
        if (user.status === "pending") {
          throw new Error("חשבונך ממתין לאישור מנהל. פנה למנהל המערכת.");
        }
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        if (user.totpSecret) {
          const code = credentials.totpCode?.trim();
          if (!code) throw new Error("NEED_TOTP");
          let secret: string;
          try {
            secret = decryptPlain(user.totpSecret);
          } catch {
            return null;
          }
          if (!verifyTOTP(secret, code)) throw new Error("קוד אימות שגוי או שפג תוקפו");
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role?: string }).id = token.id as string;
        let role = token.role as string | undefined;
        if (!role && token.id) {
          const u = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true } });
          role = u?.role;
        }
        (session.user as { id: string; role?: string }).role = role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return getServerSession(authOptions);
}
