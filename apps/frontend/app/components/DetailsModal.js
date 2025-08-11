import React, { useState } from 'react'; // Add useState import
import MachineDetails from './modal/MachineDetails';
import ServiceDetails from './modal/ServiceDetails';
import OperatorDetails from './modal/OperatorDetails';
import PrestartDetails from './modal/PrestartDetails';
import '@/styles/detailsModal.css';

// Función ayudante para obtener valores de cualquier ubicación en el registro
const getValueFromRecord = (record, field) => {
  // Si el valor está directamente en el registro
  if (record && record[field] !== undefined) {
    return record[field];
  }
  
  // Si el valor está dentro del objeto datos
  if (record && record.datos && record.datos[field] !== undefined) {
    return record.datos[field];
  }
  
  // Si el valor no se encuentra en ningún lugar
  return null;
};

const getStatus = (data) => {
  if (!data) return 'Unknown';

  const checkItems = [
    'aceite',
    'agua',
    'neumaticos',
    'nivelCombustible',
    'lucesYAlarmas',
    'frenos',
    'extintores',
    'cinturonSeguridad'
  ];

  // Usar la función helper para acceder a los datos de manera consistente
  const allChecksPass = checkItems.every(item => getValueFromRecord(data, item) === true);
  return allChecksPass ? 'OK' : 'Needs Review';
};

const DetailsModal = ({ show, onClose, data, type }) => {
    // Add state for active tabs for each modal type
    const [activeMachineTab, setActiveMachineTab] = useState('general');
    const [activeServiceTab, setActiveServiceTab] = useState('general');
    const [activeOperatorTab, setActiveOperatorTab] = useState('general');
    const [activePrestartTab, setActivePrestartTab] = useState('general');

    if (!show) return null;

    // Check if data is available
    if (!data) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Information not available</h2>
                        <button
                            onClick={onClose}
                            className="modal-close-button"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        <p className="text-center">No data available to display.</p>
                    </div>
                    <div className="modal-footer">
                        <button
                            onClick={onClose}
                            className="modal-button modal-button-cancel"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch(type) {
            case 'machine':
                return <MachineDetails 
                    machine={data} 
                    activeTab={activeMachineTab} 
                    setActiveTab={setActiveMachineTab} 
                />;
            case 'service':
                return <ServiceDetails 
                    data={data} 
                    activeTab={activeServiceTab} 
                    setActiveTab={setActiveServiceTab} 
                />;
            case 'operator':
                return <OperatorDetails 
                    operator={data} 
                    activeTab={activeOperatorTab} 
                    setActiveTab={setActiveOperatorTab} 
                />;
            case 'prestart':
                return <PrestartDetails 
                    data={data} 
                    activeTab={activePrestartTab} 
                    setActiveTab={setActivePrestartTab} 
                />;
            default:
                return <div>Unknown content type</div>;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {type === 'machine' ? 'Machine Details' : 
                         type === 'service' ? 'Service Record Details' :
                         type === 'operator' ? 'Operator Details' : 
                         'Pre-Start Check Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="modal-close-button"
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    {renderContent()}
                </div>
                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="modal-button modal-button-cancel"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;