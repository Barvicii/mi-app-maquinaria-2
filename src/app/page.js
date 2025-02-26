"use client";
import { useState } from 'react';
import { Layers, QrCode, List } from 'lucide-react';
import MaquinasRegistro from '@/components/MaquinasRegistro';
import QRGeneratorSimple from '@/components/QRGeneratorSimple';

export default function Home() {
  const [activeTab, setActiveTab] = useState('maquinas');

  const tabs = [
    { 
      id: 'maquinas', 
      label: 'Máquinas', 
      icon: Layers 
    },
    { 
      id: 'qr', 
      label: 'Generador QR', 
      icon: QrCode 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-medium 
                    border border-gray-200 
                    ${activeTab === tab.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-900 hover:bg-gray-100'}
                    ${tab.id === tabs[0].id ? 'rounded-l-lg' : ''}
                    ${tab.id === tabs[tabs.length - 1].id ? 'rounded-r-lg' : ''}
                  `}
                >
                  <Icon className="mr-2 w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Componentes principales */}
        <main>
          {activeTab === 'maquinas' && <MaquinasRegistro />}
          {activeTab === 'qr' && <QRGeneratorSimple />}
        </main>
      </div>
    </div>
  );
}