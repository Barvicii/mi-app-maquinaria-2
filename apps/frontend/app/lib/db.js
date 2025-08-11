/**
 * Configuración de base de datos simplificada
 */

import { connectDB } from '@/lib/mongodb';

export { connectDB };
export { connectDB as db };
export default connectDB;

