import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Re-export authOptions so existing imports from this file still work
export { authOptions };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };