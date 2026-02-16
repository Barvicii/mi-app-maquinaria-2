/**
 * Auth Configuration — Single Source of Truth
 * All authOptions are defined HERE. The NextAuth route re-exports from this file.
 */

import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours default
    updateAge: 60 * 60, // Refresh every hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && 
                process.env.NEXTAUTH_URL?.startsWith('https://')
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          
          const db = await connectDB();
          
          const user = await db.collection("users").findOne({ 
            email: credentials.email.toLowerCase()
          });
          
          if (!user) {
            return null;
          }
          
          if (!user.password) {
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            return null;
          }
          
          // Check if user or organization is suspended
          const userIsActive = user.status ? user.status === 'active' : user.active !== false;
          const isSuspended = user.organizationSuspended === true || !userIsActive;
          
          if (isSuspended) {
            return null;
          }
          
          // Get organization name if user has organizationId but no company
          let companyName = user.company;
          if (!companyName && user.organizationId) {
            try {
              const organization = await db.collection("organizations").findOne({
                _id: user.organizationId
              });
              
              if (organization) {
                companyName = organization.name;
                
                // Update user's company field for consistency
                await db.collection("users").updateOne(
                  { _id: user._id },
                  { $set: { company: organization.name } }
                );
              }
            } catch (orgError) {
              console.error("[AUTH] Error fetching organization:", orgError.message);
            }
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role || 'USER',
            company: companyName || '',
            organization: companyName || '',
            workplace: user.workplace || '',
            organizationId: user.organizationId?.toString() || null,
            organizationSuspended: user.organizationSuspended || false,
            organizationSuspendedAt: user.organizationSuspendedAt || null,
            rememberMe: credentials.rememberMe === 'true' || credentials.rememberMe === true
          };
          
        } catch (error) {
          console.error("[AUTH] Error in authorize:", error.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.company = user.company;
        token.organization = user.organization;
        token.workplace = user.workplace;
        token.organizationId = user.organizationId;
        token.organizationName = user.organization;
        token.organizationSuspended = user.organizationSuspended;
        token.organizationSuspendedAt = user.organizationSuspendedAt;
        token.active = true;
        token.rememberMe = user.rememberMe;
        
        // Extended session for "Remember me"
        if (user.rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id || token.sub;
        session.user.role = token.role;
        session.user.company = token.company;
        session.user.organization = token.organization;
        session.user.organizationName = token.organizationName;
        session.user.workplace = token.workplace;
        session.user.organizationId = token.organizationId;
        session.user.organizationSuspended = token.organizationSuspended;
        session.user.organizationSuspendedAt = token.organizationSuspendedAt;
        session.user.active = token.active;
        session.user.rememberMe = token.rememberMe;
        
        if (token.exp) {
          session.expires = new Date(token.exp * 1000).toISOString();
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  debug: process.env.NODE_ENV === 'development'
};

export default authOptions;

