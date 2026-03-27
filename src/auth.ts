import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation/forms';
import { prisma } from '@/lib/prisma';
import { getDefaultAvatar } from '@/lib/avatar';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        nickname: { label: 'Nickname', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { nickname: parsed.data.nickname } });
        if (!user) return null;

        const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!matches) return null;

        return {
          id: user.id,
          name: user.nickname,
          image: user.avatarUrl ?? getDefaultAvatar(user.nickname),
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
        token.picture = user.image;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = token.role as string;
        session.user.name = token.name;
        session.user.image = (token.picture as string | undefined) ?? null;
      }
      return session;
    },
  },
});
