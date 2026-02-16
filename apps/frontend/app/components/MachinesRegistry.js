'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Dashboard from './Dashboard';
import NavBar from './NavBar';
import QRGeneratorSimple from './QRGeneratorSimple';
import TabPreStart from './TabPreStart';
import TabServices from './TabServices';
import TabOperator from './TabOperator';
import TabAlertas from './TabAlertas';
import Image from 'next/image';
import TabMachinary from './TabMachinary';
import TabReports from './TabReports';
import TabPrestartTemplates from './TabPreStartTemplates'; 
import OrganizationPrestartTemplates from './OrganizationPrestartTemplates';
import TabUsers from './TabUsers';
import OrganizationManagement from './OrganizationManagement';
import ClientMetricsDashboard from './ClientMetricsDashboard';
import DieselConfig from './DieselConfig';
import TabInvoices from './TabInvoices';
import '@/styles/layout.css';
import '@/styles/machinary.css';
import '@/styles/tables.css';

const MachinesRegistry = ({ initialTab = 'dashboard', children }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [maquinas, setMaquinas] = useState([]);
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);

  // Reference for main content
  const mainContentRef = useRef(null);

  // Effects to load data
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
    const fetchMachinesAndVehicles = async () => {
      // Prevent multiple simultaneous calls
      if (isLoadingEquipment) {
        console.log('🔄 Already fetching equipment, skipping...');
        return;
      }
      
      // Only fetch if we don't already have data
      if (maquinas.length > 0) {
        console.log('📋 Equipment already loaded, skipping fetch');
        return;
      }
      
      try {
        setIsLoadingEquipment(true);
        console.log('🔄 Fetching machines and vehicles...');
        
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch both machines and vehicles
        const [machinesResponse, vehiclesResponse] = await Promise.all([
          fetch('/api/machines'),
          fetch('/api/vehicles')
        ]);

        let allEquipment = [];

        // Add machines
        if (machinesResponse.ok) {
          const machinesData = await machinesResponse.json();
          console.log('📋 Machines loaded:', machinesData.length);
          const machinesWithType = machinesData.map(machine => ({
            ...machine,
            equipmentType: 'machinery'
          }));
          allEquipment = [...allEquipment, ...machinesWithType];
        } else {
          console.error('❌ Failed to fetch machines:', machinesResponse.status);
          // Don't throw error for 429, just log it
          if (machinesResponse.status === 429) {
            console.log('⚠️ Rate limited, will retry later');
            return;
          }
        }

        // Add vehicles
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json();
          console.log('🚗 Vehicles loaded:', vehiclesData.length);
          vehiclesData.forEach(vehicle => {
            console.log(`Vehicle: ${vehicle.machineId} (${vehicle._id}) - Type: vehicle`);
          });
          const vehiclesWithType = vehiclesData.map(vehicle => ({
            ...vehicle,
            equipmentType: 'vehicle'
          }));
          allEquipment = [...allEquipment, ...vehiclesWithType];
        } else {
          console.error('❌ Failed to fetch vehicles:', vehiclesResponse.status);
          // Don't throw error for 429, just log it
          if (vehiclesResponse.status === 429) {
            console.log('⚠️ Rate limited, will retry later');
            return;
          }
        }

        console.log('✅ All equipment loaded:', allEquipment.length, 'items');
        console.log('Equipment IDs:', allEquipment.map(eq => `${eq.machineId} (${eq.equipmentType})`));
        setMaquinas(allEquipment);
      } catch (error) {
        console.error('💥 Error loading equipment:', error);
      } finally {
        setIsLoadingEquipment(false);
      }
    };

    // Only fetch if session exists
    if (session?.user?.id) {
      fetchMachinesAndVehicles();
    }
  }, [session?.user?.id]); // Keep only session?.user?.id as dependency

  const handleTabChange = (tab) => {
    // Scroll al inicio al cambiar de pestaña
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    setActiveTab(tab);
  };

  const handleDeletePrestart = (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const updatedRecords = prestartRecords.filter(record => record.id !== recordId);
      localStorage.setItem('prestartRecords', JSON.stringify(updatedRecords));
      setPrestartRecords(updatedRecords);
    }
  };

  const handleDeleteService = (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const updatedRecords = serviceRecords.filter(record => record.id !== recordId);
      localStorage.setItem('serviceRecords', JSON.stringify(updatedRecords));
      setServiceRecords(updatedRecords);
    }
  };

  // Check if user is super admin to show additional options
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || session?.user?.role === 'ADMIN';

  return (
    <div className="page-layout">
      <div className="container-layout">
        <div className="content-card">
          {/* Header */}
          <header className="app-header">
            <div className="logo-container flex items-center space-x-4">
              <Image src="/Imagen/logoo.png" alt="Logo" width={50} height={50} className="logo-image" />
              <span className="brand-text">Orchard Services</span>
            </div>
            <NavBar 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              isSuperAdmin={isSuperAdmin}
              isAdmin={isAdmin}
            />
          </header>

          {/* Main Content */}
          <main 
            className="main-content" 
            ref={mainContentRef}
          >
            {/* Main tabs */}
            {activeTab === 'dashboard' && (
              <div className="p-6">
                <ClientMetricsDashboard />
              </div>
            )}
            {activeTab === 'machines' && (
              <TabMachinary 
                maquinas={maquinas}
                setMaquinas={setMaquinas}
                suppressNotifications={true}
                onTabChange={handleTabChange} // Pasar la función handleTabChange
              />
            )}
            {activeTab === 'prestart' && (
              <TabPreStart 
                maquinas={maquinas}
                prestartRecords={prestartRecords}
                handleDeletePrestart={handleDeletePrestart}
                suppressNotifications={true}
              />
            )}
            {activeTab === 'services' && (
              <TabServices 
                maquinas={maquinas}
                serviceRecords={serviceRecords}
                handleDeleteService={handleDeleteService}
                suppressNotifications={true}
              />
            )}
            {activeTab === 'reports' && <TabReports suppressNotifications={true} />}
            {activeTab === 'invoices' && (
              <TabInvoices 
                maquinas={maquinas}
                suppressNotifications={true}
              />
            )}
            
            {/* Settings menu tabs */}
            {activeTab === 'organizations' && isSuperAdmin && <OrganizationManagement />}
            {activeTab === 'diesel' && <DieselConfig suppressNotifications={true} />}
            {activeTab === 'alertas' && <TabAlertas suppressNotifications={true} />}
            {activeTab === 'qr' && <QRGeneratorSimple maquinas={maquinas} suppressNotifications={true} />}
            {activeTab === 'operators' && <TabOperator suppressNotifications={true} />}
            {activeTab === 'prestart-templates' && (
              children || <OrganizationPrestartTemplates suppressNotifications={true} />
            )}
            {activeTab === 'users' && (isAdmin || isSuperAdmin) && <TabUsers suppressNotifications={true} />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MachinesRegistry;