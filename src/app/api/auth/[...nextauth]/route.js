import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: credentials.email }).select('+password');
        
        if (!user) {
          throw new Error('No user found with this email');
        }

        // Check if the account is active
        if (!user.isActive) {
          throw new Error('This account has been deactivated. Please contact an administrator.');
        }

        // Check if the password matches
        const isPasswordCorrect = await user.comparePassword(credentials.password);
        
        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
          operatorId: user.operatorId ? user.operatorId.toString() : null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organization = user.organization;
        token.operatorId = user.operatorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organization = token.organization;
        session.user.operatorId = token.operatorId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production',
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };