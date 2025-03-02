import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions = {
  debug: true, // Remove in production
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const db = await connectDB();
          const user = await db.collection('users').findOne({ 
            email: credentials.email.toLowerCase()
          });

          console.log('Found user:', user ? 'yes' : 'no');

          if (!user) {
            console.log('No user found');
            return null;
          }

          // For plain text passwords (temporary, not recommended for production)
          if (credentials.password === user.password) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name || user.email
            };
          }

          // For hashed passwords (recommended for production)
          // const isValid = await bcrypt.compare(credentials.password, user.password);
          // if (isValid) {
          //   return {
          //     id: user._id.toString(),
          //     email: user.email,
          //     name: user.name || user.email
          //   };
          // }

          console.log('Invalid password');
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };