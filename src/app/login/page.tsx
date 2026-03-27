export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validation/forms';
import { auth, signIn } from '@/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) redirect('/');
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Вход</p>
        <h1 className="mt-2 text-3xl font-black">Логин в Igra MVP</h1>
        {params.error ? <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{params.error}</p> : null}
        <form
          action={async (formData) => {
            'use server';
            const parsed = loginSchema.safeParse({ nickname: formData.get('nickname'), password: formData.get('password') });
            if (!parsed.success) redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Проверь данные формы.')}`);
            try {
              await signIn('credentials', {
                nickname: parsed.data.nickname,
                password: parsed.data.password,
                redirectTo: '/',
              });
            } catch {
              redirect('/login?error=Неверный%20логин%20или%20пароль');
            }
          }}
          className="mt-6 grid gap-4"
        >
          <input name="nickname" type="text" placeholder="Никнейм" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <input name="password" type="password" placeholder="Пароль" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <Button type="submit">Войти</Button>
        </form>
        <p className="mt-5 text-sm text-zinc-400">
          Нет аккаунта? <Link href="/register" className="text-cyan-300 underline underline-offset-4">Создать профиль</Link>
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-900/80 p-4 text-sm text-zinc-300">
          <p className="font-semibold">Локальный админ</p>
          <p className="mt-2">admin / admin123</p>
        </div>
      </Card>
    </main>
  );
}
