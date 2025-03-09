import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb"; // Importa MongoClient directamente
import { compare } from "bcrypt";

// Obtén la URI de MongoDB desde las variables de entorno
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
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
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Crea una conexión directa a MongoDB para este request
          const client = new MongoClient(uri);
          await client.connect();
          
          // Accede a la base de datos
          const db = client.db();
          
          const user = await db.collection("users").findOne({
            email: credentials.email
          });

          // Cierra la conexión después de usarla
          await client.close();

          if (!user || !user.password) {
            return null;
          }

          const passwordMatch = await compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            randomKey: "Hey cool"
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login"
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };