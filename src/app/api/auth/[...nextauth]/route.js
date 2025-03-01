import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      async authorize(credentials) {
        try {
          console.log('Starting authorization...'); // Debug log
          await dbConnect();

          const user = await User.findOne({ email: credentials.email })
            .select('+password');

          console.log('User found:', user ? 'Yes' : 'No'); // Debug log

          if (!user) {
            throw new Error('Invalid credentials');
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('Password valid:', isValid); // Debug log

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          console.log('Authorization successful'); // Debug log
          
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback - User:', user ? 'Present' : 'Missing'); // Debug log
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Token:', token ? 'Present' : 'Missing'); // Debug log
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permitir que el cliente maneje la redirección
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
  pages: {
    signIn: '/login'
  },
  debug: true
});

export { handler as GET, handler as POST };