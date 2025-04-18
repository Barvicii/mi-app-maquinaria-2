import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from 'next/server';

// Leer la dirección base de la aplicación del entorno
const appUrl = process.env.NEXTAUTH_URL || `http://${process.env.VERCEL_URL}` || 'http://localhost:3000';

export async function middleware(request) {
  // Verificar que estamos recibiendo la solicitud correctamente
  console.log('NextAuth API called:', request.url);
  console.log('NextAuth headers:', Object.fromEntries(request.headers));
  
  // Continuar con el manejo normal
  return NextResponse.next();
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("Authorize function called with email:", credentials.email);
          
          const db = await connectDB();
          const user = await db.collection("users").findOne({ 
            email: credentials.email 
          });

          if (!user) {
            console.log("No user found with email:", credentials.email);
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("Password doesn't match for user:", credentials.email);
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0]
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw error; // Propagar el error para mejor diagnóstico
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  trustHost: true, // Importante cuando usas direcciones IP
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };