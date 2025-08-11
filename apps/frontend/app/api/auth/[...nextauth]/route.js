import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimiter } from '@/lib/rateLimiter';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas (reducido de 30 días)
    updateAge: 60 * 60, // Actualizar cada hora
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
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
        // Solo requerir HTTPS en producción REAL (no localhost)
        secure: process.env.NODE_ENV === 'production' && 
                !process.env.NEXTAUTH_URL?.includes('localhost')
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
          console.log("🔐 [AUTH] Authorize function called with email:", credentials.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ [AUTH] Missing email or password");
            return null;
          }
          
          const db = await connectDB();
          console.log("✅ [AUTH] Connected to database");
          
          const user = await db.collection("users").findOne({ 
            email: credentials.email 
          });
          
          if (!user) {
            console.log("❌ [AUTH] No user found with email:", credentials.email);
            return null;
          }
          
          console.log("✅ [AUTH] User found:", user._id.toString(), "Name:", user.name, "Role:", user.role);
          
          // Verificar contraseña
          if (user.password) {
            console.log("🔍 [AUTH] User has direct password field");
            
            const isValid = await bcrypt.compare(credentials.password, user.password);
            
            if (!isValid) {
              console.log("❌ [AUTH] Direct password doesn't match");
              return null;
            }
            
            console.log("✅ [AUTH] Direct password matched successfully");
            
            // Get organization name if user has organizationId but no company
            let companyName = user.company;
            if (!companyName && user.organizationId) {
              try {
                const organization = await db.collection("organizations").findOne({
                  _id: user.organizationId
                });
                
                if (organization) {
                  companyName = organization.name;
                  console.log("✅ [AUTH] Found organization name:", companyName);
                  
                  // Update user's company field for consistency
                  await db.collection("users").updateOne(
                    { _id: user._id },
                    { $set: { company: organization.name } }
                  );
                  console.log("✅ [AUTH] Updated user company field");
                }
              } catch (orgError) {
                console.error("⚠️ [AUTH] Error fetching organization:", orgError);
              }
            }
            
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: user.role || 'user',
              company: companyName || '',
              organization: companyName || '', // Agregar organization para consistencia
              workplace: user.workplaceName || '',
              organizationId: user.organizationId?.toString() || null,
              organizationSuspended: user.organizationSuspended || false,
              organizationSuspendedAt: user.organizationSuspendedAt || null
            };
          }
          
          console.log("❌ [AUTH] User doesn't have direct password field");
          return null;
          
        } catch (error) {
          console.error("💥 [AUTH] Error in authorize function:", error);
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
        token.organizationSuspended = user.organizationSuspended;
        token.organizationSuspendedAt = user.organizationSuspendedAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.company = token.company;
        session.user.organization = token.organization;
        session.user.workplace = token.workplace;
        session.user.organizationId = token.organizationId;
        session.user.organizationSuspended = token.organizationSuspended;
        session.user.organizationSuspendedAt = token.organizationSuspendedAt;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };