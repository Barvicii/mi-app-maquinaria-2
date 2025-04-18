'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Dashboard from './Dashboard';
import NavBar from './NavBar';
import QRGeneratorSimple from './QRGeneratorSimple';
import TabPreStart from './TabPreStart';
import TabServices from './TabServices';
import TabOperator from './TabOperator';
import TabAlertas from './TabAlertas';
import TabMachinary from './TabMachinary';
import '../styles/layout.css';
import '../styles/machinary.css';
import '../styles/tables.css';

const MachinesRegistry = ({ initialTab = 'dashboard', children }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [maquinas, setMaquinas] = useState([]);
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);

  // Efectos para cargar datos
  useEffect(() => {
    const loadRecords = () => {
      try {
        const prestartFromStorage = JSON.parse(localStorage.getItem('prestartRecords') || '[]');
        const serviceFromStorage = JSON.parse(localStorage.getItem('serviceRecords') || '[]');
        setPrestartRecords(prestartFromStorage);
        setServiceRecords(serviceFromStorage);
      } catch (error) {
        console.error('Error loading records:', error);
      }
    };
    loadRecords();
  }, []);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (!response.ok) {
          throw new Error('Error fetching machines');
        }
        const data = await response.json();
      } catch (error) {
        console.error('Error loading machines:', error);
      }
    };

    if (session) {
      fetchMachines();
    }
  }, [session]);

  const handleTabChange = (tab) => {
    if (tab === 'prestart-templates') {
      window.location.href = '/admin/prestart-templates';
      return;
    }
    
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

  return (
    <div className="page-layout">
      <div className="container-layout">
        <div className="content-card">
          {/* Header */}
          <header className="app-header">
            <div className="logo-container flex items-center space-x-4">
              <img src="/Imagen/logoo.png" alt="Logo" className="logo-image" />
              <span className="brand-text">Orchard Service</span>
            </div>
            <NavBar activeTab={activeTab} onTabChange={handleTabChange} />
          </header>

          {/* Main Content */}
          <main className="main-content">
            {activeTab === 'machines' && (
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
            {activeTab === 'dashboard' && (
              <Dashboard onNavigate={handleTabChange} />
            )}
            {activeTab === 'prestart-templates' && children}
          </main>

         
        </div>
      </div>
    </div>
  );
};

export default MachinesRegistry;