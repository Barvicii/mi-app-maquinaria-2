/**
 * Auth library para Next.js
 * Sistema simplificado
 */

import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log('🔐 [AUTH] Authorize function called with email:', credentials.email);
          await dbConnect();
          console.log('✅ [AUTH] Connected to database');
          
          // Buscar usuario usando el modelo
          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          });

          if (!user) {
            console.log('❌ [AUTH] User not found:', credentials.email);
            return null;
          }

          console.log(`✅ [AUTH] User found: ${user._id} Name: ${user.name} Role: ${user.role}`);

          if (!user.password) {
            console.log('❌ [AUTH] User has no password field');
            return null;
          }

          console.log('🔍 [AUTH] User has direct password field');

          // Verificar password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('❌ [AUTH] Invalid password for user:', credentials.email);
            return null;
          }

          console.log('✅ [AUTH] Direct password matched successfully');

          // Log de auditoría para sesiones extendidas
          if (credentials.rememberMe === 'true' || credentials.rememberMe === true) {
            console.log(`🔒 [AUTH] Extended session requested for user: ${user.email}`);
          }

          // Retornar datos del usuario con información de "Remember me"
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'USER',
            organizationId: user.organizationId?.toString(),
            organizationName: user.organizationName,
            active: user.active,
            rememberMe: credentials.rememberMe === 'true' || credentials.rememberMe === true
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    // Configuración de tiempo de vida de la sesión
    maxAge: 24 * 60 * 60, // 24 horas por defecto
  },
  jwt: {
    // Configurar tiempo de vida del JWT según "Remember me"
    maxAge: 24 * 60 * 60, // 24 horas por defecto
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // La duración se maneja dinámicamente en los callbacks
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.active = user.active;
        token.rememberMe = user.rememberMe;
        
        // Configurar tiempo de expiración basado en "Remember me"
        if (user.rememberMe) {
          // 30 días si "Remember me" está activado
          const extendedExpiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
          token.exp = extendedExpiry;
          console.log(`🔒 [AUTH] Extended session set to expire: ${new Date(extendedExpiry * 1000).toISOString()}`);
        } else {
          // 24 horas por defecto
          const standardExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
          token.exp = standardExpiry;
          console.log(`⏰ [AUTH] Standard session set to expire: ${new Date(standardExpiry * 1000).toISOString()}`);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      session.user.organizationName = token.organizationName;
      session.user.active = token.active;
      session.user.rememberMe = token.rememberMe;
      
      // Agregar información de expiración para debugging
      if (token.exp) {
        session.expires = new Date(token.exp * 1000).toISOString();
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
};

export { authOptions as default };

