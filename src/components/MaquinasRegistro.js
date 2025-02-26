"use client";
import React, { useState, useEffect } from 'react';
import { Wrench, Clipboard, Bell, Settings, QrCode, Users } from 'lucide-react';
import QRGeneratorSimple from './QRGeneratorSimple';
import MaquinaModal from './MaquinaModal';
import TabPreStart from './TabPreStart';
import TabServices from './TabServices';
import TabOperator from './TabOperator';
import TabAlertas from './TabAlertas';
import TabMachinary from './TabMachinary';
import '../styles/layout.css';

const MaquinasRegistro = () => {
  // Estado para la navegación entre pestañas
  const [activeTab, setActiveTab] = useState('maquinas');

  // Estados principales
  const [maquinas, setMaquinas] = useState([]);
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);

  // Estado para modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);

  // Efectos para cargar datos
  useEffect(() => {
    const loadRecords = () => {
      const prestartFromStorage = JSON.parse(localStorage.getItem('prestartRecords') || '[]');
      const serviceFromStorage = JSON.parse(localStorage.getItem('serviceRecords') || '[]');
      setPrestartRecords(prestartFromStorage);
      setServiceRecords(serviceFromStorage);
    };
    loadRecords();
  }, []);

  useEffect(() => {
    const maquinasGuardadas = JSON.parse(localStorage.getItem('maquinas') || '[]');
    setMaquinas(maquinasGuardadas);
  }, []);

  // Manejadores
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleDeletePrestart = (recordId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      const updatedRecords = prestartRecords.filter(record => record.id !== recordId);
      localStorage.setItem('prestartRecords', JSON.stringify(updatedRecords));
      setPrestartRecords(updatedRecords);
    }
  };

  const handleDeleteService = (recordId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      const updatedRecords = serviceRecords.filter(record => record.id !== recordId);
      localStorage.setItem('serviceRecords', JSON.stringify(updatedRecords));
      setServiceRecords(updatedRecords);
    }
  };

  // Componente de navegación
  const Navigation = () => (
    <nav className="navigation-container">
      <button
        className={`nav-button ${activeTab === 'maquinas' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('maquinas')}
      >
        <Wrench className="nav-icon" />
        <span>Machines</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'prestart' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('prestart')}
      >
        <Clipboard className="nav-icon" />
        <span>Pre-Start</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'services' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('services')}
      >
        <Settings className="nav-icon" />
        <span>Services</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'alertas' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('alertas')}
      >
        <Bell className="nav-icon" />
        <span>Alerts</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'qr' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('qr')}
      >
        <QrCode className="nav-icon" />
        <span>QR</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'operators' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => handleTabChange('operators')}
      >
        <Users className="nav-icon" />
        <span>Operators</span>
      </button>
    </nav>
  );

  // Inicio del renderizado principal
  return (
    <div className="page-layout">
      <div className="container-layout">
        <div className="content-card">
          {/* Header */}
          <header className="app-header">
  <div className="logo-container flex items-center space-x-4">
    <img src="Imagen/logoo.png" alt="Logo" className="logo-image" />
    <span className="brand-text">Orchard Service</span>
  </div>
  <Navigation />
</header>

          {/* Main Content */}
          <main className="main-content">
            {activeTab === 'maquinas' && (
              <TabMachinary 
                maquinas={maquinas}
                setMaquinas={setMaquinas}
              />
            )}
            {activeTab === 'prestart' && (
              <TabPreStart 
                prestartRecords={prestartRecords}
                handleDeletePrestart={handleDeletePrestart}
              />
            )}
            {activeTab === 'services' && (
              <TabServices 
                serviceRecords={serviceRecords}
                handleDeleteService={handleDeleteService}
              />
            )}
            {activeTab === 'alertas' && <TabAlertas />}
            {activeTab === 'qr' && <QRGeneratorSimple maquinas={maquinas} />}
            {activeTab === 'operators' && <TabOperator />}
          </main>
        </div>
      </div>

      {/* Machine Modal */}
      <MaquinaModal 
        showModal={showModal}
        modalType={modalType}
        maquinaSeleccionada={maquinaSeleccionada}
        setShowModal={setShowModal}
        setMaquinaSeleccionada={setMaquinaSeleccionada}
        onMaquinaAdded={(newMaquina) => {
          const maquinasActualizadas = [...maquinas, newMaquina];
          setMaquinas(maquinasActualizadas);
          localStorage.setItem('maquinas', JSON.stringify(maquinasActualizadas));
        }}
        onMaquinaUpdated={(updatedMaquina) => {
          const maquinasActualizadas = maquinas.map(m => 
            m.id === updatedMaquina.id ? updatedMaquina : m
          );
          setMaquinas(maquinasActualizadas);
          localStorage.setItem('maquinas', JSON.stringify(maquinasActualizadas));
        }}
      />

      {/* Footer */}
      <footer className="main-footer bg-gray-50 py-6 border-t border-gray-200">
        <div className="footer-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="footer-content flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo and Copyright */}
            <div className="footer-logo flex items-center space-x-4">
              <img src="Imagen/logoo.png" alt="Logo" className="h-12 w-auto" />
              <p className="footer-copyright text-sm text-gray-600">
                © {new Date().getFullYear()} Orchard Services. All rights reserved.
              </p>
            </div>

            {/* Quick Links */}
            <div className="footer-links flex flex-wrap justify-center space-x-4">
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Contact
              </a>
              <a
                href="/privacy-legal"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Privacy & Legal
              </a>
              <a
                href="/news"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                News
              </a>
            </div>

            {/* Version */}
            <div className="footer-version text-sm text-gray-600">
              Version 1.0.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MaquinasRegistro;