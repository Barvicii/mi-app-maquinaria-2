import React, { useState } from 'react'; // Add useState import
import MachineDetails from './modal/MachineDetails';
import VehicleDetails from './VehicleDetails';
import ServiceDetails from './modal/ServiceDetails';
import OperatorDetails from './modal/OperatorDetails';
import PrestartDetails from './modal/PrestartDetails';
import '@/styles/detailsModal.css';
import '@/styles/machinemodal.css'; // Para las clases de tabs

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
    const [activeVehicleTab, setActiveVehicleTab] = useState('general');
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
            case 'vehicle':
                return <VehicleDetails 
                    vehicle={data} 
                    activeTab={activeVehicleTab} 
                    setActiveTab={setActiveVehicleTab} 
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
                {/* Close button positioned absolutely in top right corner */}
                <button 
                    type="button"
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none z-20 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                    onClick={onClose}
                >
                    ×
                </button>

                <div className="modal-header">
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {type === 'machine' ? 'Machine Details' : 
                             type === 'vehicle' ? 'Vehicle Details' :
                             type === 'service' ? 'Service Record Details' :
                             type === 'operator' ? 'Operator Details' : 
                             'Pre-Start Check Details'}
                        </h2>
                        
                        <div className="flex items-center space-x-8">
                            {/* Tabs para Machine en el header */}
                            {type === 'machine' && (
                                <div className="flex space-x-1">
                                    {['General', 'Oils', 'Filters', 'Tires'].map((label, index) => {
                                        const tabIds = ['general', 'oils', 'filters', 'tires'];
                                        const tabId = tabIds[index];
                                        return (
                                            <button 
                                                key={tabId}
                                                type="button"
                                                className={`tab-button ${activeMachineTab === tabId ? 'tab-button-active' : 'tab-button-inactive'}`}
                                                onClick={() => setActiveMachineTab(tabId)}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Tabs para Vehicle en el header */}
                            {type === 'vehicle' && (
                                <div className="flex space-x-1">
                                    {['Basic Info', 'RUC & REGO', 'Oils', 'Filters', 'Tires'].map((label, index) => {
                                        const tabIds = ['general', 'ruc-rego', 'oils', 'filters', 'tires'];
                                        const tabId = tabIds[index];
                                        return (
                                            <button 
                                                key={tabId}
                                                type="button"
                                                className={`tab-button ${activeVehicleTab === tabId ? 'tab-button-active' : 'tab-button-inactive'}`}
                                                onClick={() => setActiveVehicleTab(tabId)}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
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