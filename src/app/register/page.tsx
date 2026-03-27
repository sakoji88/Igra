export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { getCurrentSeason } from '@/lib/server/auth';
import { getDefaultAvatar } from '@/lib/avatar';
import { registerSchema } from '@/lib/validation/forms';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) redirect('/');
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Регистрация</p>
        <h1 className="mt-2 text-3xl font-black">Создать игрока</h1>
        {params.error ? <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{params.error}</p> : null}
        <form
          action={async (formData) => {
            'use server';
            const parsedResult = registerSchema.safeParse({
              nickname: formData.get('nickname'),
              password: formData.get('password'),
              avatarUrl: formData.get('avatarUrl'),
            });
            if (!parsedResult.success) redirect(`/register?error=${encodeURIComponent(parsedResult.error.issues[0]?.message ?? 'Проверь данные формы.')}`);
            const parsed = parsedResult.data;

            const exists = await prisma.user.findUnique({ where: { nickname: parsed.nickname } });
            if (exists) redirect('/register?error=Такой%20ник%20уже%20существует');

            const season = await getCurrentSeason();
            const passwordHash = await bcrypt.hash(parsed.password, 10);
            await prisma.user.create({
              data: {
                nickname: parsed.nickname,
                passwordHash,
                avatarUrl: parsed.avatarUrl || getDefaultAvatar(parsed.nickname),
                role: 'PLAYER',
                profile: {
                  create: {
                    displayName: parsed.nickname,
                    bio: 'Новый игрок сезона.',
                  },
                },
                seasonStates: {
                  create: {
                    seasonId: season.id,
                    boardPosition: 0,
                    score: 0,
                    availableWheelSpins: 0,
                  },
                },
              },
            });

            await prisma.eventLog.create({
              data: {
                seasonId: season.id,
                type: 'AUTH',
                summary: `${parsed.nickname} зарегистрировался и появился на старте.`,
                payload: { nickname: parsed.nickname },
              },
            });

            await signIn('credentials', {
              nickname: parsed.nickname,
              password: parsed.password,
              redirectTo: '/',
            });
          }}
          className="mt-6 grid gap-4"
        >
          <input name="nickname" type="text" placeholder="Никнейм" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <input name="password" type="password" placeholder="Пароль" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <input name="avatarUrl" type="url" placeholder="Avatar URL (необязательно)" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <Button type="submit">Создать игрока</Button>
        </form>
        <p className="mt-5 text-sm text-zinc-400">
          Уже есть аккаунт? <Link href="/login" className="text-cyan-300 underline underline-offset-4">Войти</Link>
        </p>
      </Card>
    </main>
  );
}
