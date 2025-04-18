import React, { useState, useEffect } from 'react';
import { Bell, Send } from 'lucide-react';

const TabAlertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [configuracion, setConfiguracion] = useState({
    emailNotificacion: '',
    horasAnticipacion: 50,
    intervaloRevision: 24,
    notificacionesActivas: true
  });
  const [ultimaRevision, setUltimaRevision] = useState(null);

  useEffect(() => {
    // Load saved configuration
    const configGuardada = JSON.parse(localStorage.getItem('alertasConfig') || 'null');
    if (configGuardada) {
      setConfiguracion(configGuardada);
    }

    // Load last review
    const ultimaRevisionGuardada = localStorage.getItem('ultimaRevisionAlertas');
    if (ultimaRevisionGuardada) {
      setUltimaRevision(new Date(ultimaRevisionGuardada));
    }
  }, []);

  useEffect(() => {
    const verificarAlertas = async () => {
      try {
        // Get machines
        const maquinas = JSON.parse(localStorage.getItem('maquinas') || '[]');
        
        // Calculate alerts
        const alertasActualizadas = maquinas.map(maquina => {
          const horasActuales = Number(maquina.horasActuales) || 0;
          const horasProximoService = Number(maquina.proximoService) || 0;
          const horasRestantes = horasProximoService - horasActuales;

          if (horasRestantes <= configuracion.horasAnticipacion) {
            return {
              maquinaId: maquina.id,
              tipo: 'proximoService',
              mensaje: `The machine ${maquina.modelo} (${maquina.marca}) will need service in ${horasRestantes} hours.`,
              horasRestantes,
              fechaAlerta: new Date().toISOString()
            };
          }
          return null;
        }).filter(Boolean);

        setAlertas(alertasActualizadas);
        
        // If there are new alerts and notifications are active, send email
        if (alertasActualizadas.length > 0 && 
            configuracion.notificacionesActivas && 
            configuracion.emailNotificacion) {
          await enviarAlertasPorEmail(alertasActualizadas);
        }

        // Update last review
        const ahora = new Date();
        setUltimaRevision(ahora);
        localStorage.setItem('ultimaRevisionAlertas', ahora.toISOString());
      } catch (error) {
        console.error('Error verifying alerts:', error);
      }
    };

    // Verify alerts immediately and set the interval
    verificarAlertas();
    const interval = setInterval(verificarAlertas, configuracion.intervaloRevision * 3600000);

    return () => clearInterval(interval);
  }, [configuracion]);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const nuevaConfig = {
      ...configuracion,
      [name]: newValue
    };
    
    setConfiguracion(nuevaConfig);
    localStorage.setItem('alertasConfig', JSON.stringify(nuevaConfig));
  };

  const enviarAlertasPorEmail = async (alertasParaEnviar) => {
    // Here you would implement the logic to send emails
    // For now we just simulate the sending
    console.log('Sending alerts by email to:', configuracion.emailNotificacion);
    console.log('Alerts:', alertasParaEnviar);
    
    // In the future, here would go the integration with an email service
    // For example, using SendGrid, NodeMailer, or a custom endpoint
  };

  const verificarAlertasManualmente = () => {
    const maquinas = JSON.parse(localStorage.getItem('maquinas') || '[]');
    const alertasActualizadas = maquinas
      .map(maquina => {
        const horasActuales = Number(maquina.horasActuales) || 0;
        const horasProximoService = Number(maquina.proximoService) || 0;
        const horasRestantes = horasProximoService - horasActuales;

        if (horasRestantes <= configuracion.horasAnticipacion) {
          return {
            maquinaId: maquina.id,
            tipo: 'proximoService',
            mensaje: `The machine ${maquina.modelo} (${maquina.marca}) will need service in ${horasRestantes} hours.`,
            horasRestantes,
            fechaAlerta: new Date().toISOString()
          };
        }
        return null;
      })
      .filter(Boolean);

    setAlertas(alertasActualizadas);
    const ahora = new Date();
    setUltimaRevision(ahora);
    localStorage.setItem('ultimaRevisionAlertas', ahora.toISOString());
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="section-title">Alert System</h2>
      </div>
      
      {/* Alert configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-black mb-4">Alert Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-black mb-2">Notification Email</label>
            <input
              type="email"
              name="emailNotificacion"
              value={configuracion.emailNotificacion}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-black mb-2">Alert in advance (hours)</label>
            <input
              type="number"
              name="horasAnticipacion"
              value={configuracion.horasAnticipacion}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded-md text-black"
              min="1"
            />
          </div>

          <div>
            <label className="block text-black mb-2">Review interval (hours)</label>
            <input
              type="number"
              name="intervaloRevision"
              value={configuracion.intervaloRevision}
              onChange={handleConfigChange}
              className="w-full p-2 border rounded-md text-black"
              min="1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="notificacionesActivas"
              checked={configuracion.notificacionesActivas}
              onChange={handleConfigChange}
              className="w-4 h-4"
              id="notificacionesActivas"
            />
            <label htmlFor="notificacionesActivas" className="text-black">
              Email notifications active
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={verificarAlertasManualmente}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
            Check alerts now
          </button>
        </div>

        {ultimaRevision && (
          <p className="text-sm text-gray-500 mt-2">
            Last review: {new Date(ultimaRevision).toLocaleString()}
          </p>
        )}
      </div>

      {/* List of active alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-black">Active Alerts</h3>
        </div>
        <div className="p-6">
          {alertas.length > 0 ? (
            <div className="space-y-4">
              {alertas.map((alerta, index) => (
                <div 
                  key={`${alerta.maquinaId}-${index}`}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-black font-medium">{alerta.mensaje}</p>
                      <p className="text-sm text-gray-600">
                        Remaining hours: {alerta.horasRestantes}
                      </p>
                      <p className="text-xs text-gray-500">
                        Alert generated: {new Date(alerta.fechaAlerta).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No active alerts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabAlertas;