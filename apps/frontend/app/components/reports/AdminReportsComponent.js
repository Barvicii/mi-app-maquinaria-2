import React from 'react';

const AdminReportsComponent = () => {
  console.log('🔍 AdminReportsComponent rendering...');
  console.log('🔍 Current time:', new Date().toISOString());
  console.log('🔍 React version:', React.version);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-green-600">
          ✅ El componente AdminReportsComponent está funcionando!
        </h1>
        <p className="text-gray-600 mt-2">
          Este es un mensaje de prueba para verificar que el componente se renderiza correctamente.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">
            🎯 Si puedes ver este mensaje, significa que:
          </p>
          <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
            <li>La página /admin/reports se carga correctamente</li>
            <li>El componente AdminReportsComponent se renderiza</li>
            <li>Los permisos de admin están funcionando</li>
          </ul>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            🚀 Próximos pasos:
          </h2>
          <p className="text-green-700">
            Una vez confirmado que este componente se ve correctamente, 
            podemos restaurar la funcionalidad completa de reportes organizacionales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsComponent;
