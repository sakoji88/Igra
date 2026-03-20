import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Igra MVP',
  description: 'Закрытая MVP-платформа для сезонного игрового ивента между друзьями.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
