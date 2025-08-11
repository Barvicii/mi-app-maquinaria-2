import React from "react";
import Image from "next/image";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/Imagen/logoo.png" alt="Logo" width={80} height={80} className="h-20 w-auto" />
        </div>
        
        {/* Título */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Inicio de Sesión</h2>
        
        {/* Formulario */}
        <form>
          <div className="mb-4">
            <label className="block text-gray-700">Usuario</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ingresa tu usuario" />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700">Contraseña</label>
            <input type="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ingresa tu contraseña" />
          </div>
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">Iniciar Sesión</button>
        </form>
        
        {/* Recuperar contraseña */}
        <div className="text-center mt-4">
          <a href="#" className="text-indigo-600 hover:underline">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;