import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    role?: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}
