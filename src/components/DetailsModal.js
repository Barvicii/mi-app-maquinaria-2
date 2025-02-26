import React from 'react';

const DetailsModal = ({ show, onClose, data, type }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-black mb-4">
          Detalles del {type === 'prestart' ? 'Pre-Start Check' : 'Service'}
        </h3>
        
        <div className="space-y-4">
          {type === 'prestart' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-black">Máquina:</p>
                  <p className="text-gray-600">{data.datos.maquina}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Operador:</p>
                  <p className="text-gray-600">{data.datos.operador}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Horas:</p>
                  <p className="text-gray-600">{data.datos.horasMaquina}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Fecha:</p>
                  <p className="text-gray-600">{new Date(data.fecha).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="font-medium text-black mb-2">Checklist:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.aceite ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Nivel de Aceite</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.agua ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Nivel de Agua</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.neumaticos ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Estado de Neumáticos</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.nivelCombustible ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Nivel de Combustible</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.lucesYAlarmas ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Luces y Alarmas</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.frenos ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Sistema de Frenos</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.extintores ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Extintores</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${data.datos.cinturonSeguridad ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Cinturón de Seguridad</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-black">Máquina:</p>
                  <p className="text-gray-600">{data.datos.maquina}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Tipo de Service:</p>
                  <p className="text-gray-600">{data.datos.tipoService}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Técnico:</p>
                  <p className="text-gray-600">{data.datos.tecnico}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Fecha:</p>
                  <p className="text-gray-600">{new Date(data.fecha).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Horas Actuales:</p>
                  <p className="text-gray-600">{data.datos.horasActuales}</p>
                </div>
                <div>
                  <p className="font-medium text-black">Próximo Service:</p>
                  <p className="text-gray-600">{data.datos.horasProximoService}</p>
                </div>
              </div>

              {data.datos.trabajosRealizados && data.datos.trabajosRealizados.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-black mb-2">Trabajos Realizados:</p>
                  <ul className="list-disc pl-5">
                    {data.datos.trabajosRealizados.map((trabajo, index) => (
                      <li key={index} className="text-gray-600">{trabajo}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.datos.repuestos && (
                <div className="mt-4">
                  <p className="font-medium text-black mb-2">Repuestos Utilizados:</p>
                  <p className="text-gray-600">{data.datos.repuestos}</p>
                </div>
              )}
            </>
          )}

          {data.datos.observaciones && (
            <div className="mt-4">
              <p className="font-medium text-black mb-2">Observaciones:</p>
              <p className="text-gray-600">{data.datos.observaciones}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;