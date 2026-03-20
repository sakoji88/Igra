import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { users } from '../../../prisma/seed-data';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Вход по инвайту</p>
        <h1 className="mt-2 text-3xl font-black">Логин в Igra MVP</h1>
        <form
          action={async (formData) => {
            'use server';
            await signIn('credentials', {
              email: formData.get('email'),
              password: formData.get('password'),
              redirectTo: '/',
            });
          }}
          className="mt-6 grid gap-4"
        >
          <input name="email" type="email" placeholder="Email" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <input name="password" type="password" placeholder="Пароль" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3" />
          <Button type="submit">Войти</Button>
        </form>
        <div className="mt-6 rounded-2xl bg-zinc-900/80 p-4 text-sm text-zinc-300">
          <p className="font-semibold">Демо-аккаунты</p>
          <ul className="mt-3 space-y-2">{users.map((user) => <li key={user.id}>{user.email} / {user.password} / {user.role}</li>)}</ul>
        </div>
      </Card>
    </main>
  );
}
