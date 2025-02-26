"use client";
import React, { useState } from 'react';

const MaquinaModal = ({ 
    showModal, 
    modalType, 
    maquinaSeleccionada, 
    nuevaMaquina, 
    setShowModal, 
    setMaquinaSeleccionada, 
    setNuevaMaquina, 
    agregarMaquina, 
    actualizarMaquina 
  }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!showModal || (modalType !== 'nueva-maquina' && modalType !== 'editar')) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-black">
            {modalType === 'nueva-maquina' ? 'New Machine' : 'Edit Machine'}
          </h3>
          
          {/* Modal Tabs */}
          <div className="flex space-x-4 mt-4">
            {[
              { id: 'general', label: 'General Information' },
              { id: 'aceites', label: 'Oils' },
              { id: 'filtros', label: 'Filters' },
              { id: 'neumaticos', label: 'Tires' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-black hover:bg-indigo-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Machine name"
                  value={modalType === 'editar' ? maquinaSeleccionada.nombre : nuevaMaquina.nombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, nombre: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, nombre: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Model
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Model"
                  value={modalType === 'editar' ? maquinaSeleccionada.modelo : nuevaMaquina.modelo}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, modelo: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, modelo: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Brand"
                  value={modalType === 'editar' ? maquinaSeleccionada.marca : nuevaMaquina.marca}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, marca: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, marca: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Serial number"
                  value={modalType === 'editar' ? maquinaSeleccionada.serie : nuevaMaquina.serie}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, serie: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, serie: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Machinery ID
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Machinery ID"
                  value={modalType === 'editar' ? maquinaSeleccionada.maquinariaId : nuevaMaquina.maquinariaId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, maquinariaId: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, maquinariaId: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Year
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Year"
                  value={modalType === 'editar' ? maquinaSeleccionada.anio : nuevaMaquina.anio}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, anio: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, anio: value});
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Current Hours/KM
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Current hours or KM"
                  value={modalType === 'editar' ? maquinaSeleccionada.horasActuales : nuevaMaquina.horasActuales}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modalType === 'editar') {
                      setMaquinaSeleccionada({...maquinaSeleccionada, horasActuales: value});
                    } else {
                      setNuevaMaquina({...nuevaMaquina, horasActuales: value});
                    }
                  }}
                />
              </div>
            </div>
          )}
        
          {activeTab === 'aceites' && (
            <div className="space-y-6">
              {/* Engine Oil */}
              <div className="border-b pb-6">
                <h4 className="font-medium text-black mb-4">Engine Oil</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil type"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteMotor.tipo : nuevaMaquina.aceiteMotor.tipo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteMotor: { ...maquinaSeleccionada.aceiteMotor, tipo: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteMotor: { ...nuevaMaquina.aceiteMotor, tipo: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteMotor.marca : nuevaMaquina.aceiteMotor.marca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteMotor: { ...maquinaSeleccionada.aceiteMotor, marca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteMotor: { ...nuevaMaquina.aceiteMotor, marca: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Capacity in liters"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteMotor.capacidad : nuevaMaquina.aceiteMotor.capacidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteMotor: { ...maquinaSeleccionada.aceiteMotor, capacidad: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteMotor: { ...nuevaMaquina.aceiteMotor, capacidad: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Hydraulic Oil */}
              <div className="border-b pb-6">
                <h4 className="font-medium text-black mb-4">Hydraulic Oil</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil type"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteHidraulico.tipo : nuevaMaquina.aceiteHidraulico.tipo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteHidraulico: { ...maquinaSeleccionada.aceiteHidraulico, tipo: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteHidraulico: { ...nuevaMaquina.aceiteHidraulico, tipo: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteHidraulico.marca : nuevaMaquina.aceiteHidraulico.marca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteHidraulico: { ...maquinaSeleccionada.aceiteHidraulico, marca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteHidraulico: { ...nuevaMaquina.aceiteHidraulico, marca: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Capacity in liters"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteHidraulico.capacidad : nuevaMaquina.aceiteHidraulico.capacidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteHidraulico: { ...maquinaSeleccionada.aceiteHidraulico, capacidad: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteHidraulico: { ...nuevaMaquina.aceiteHidraulico, capacidad: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Transmission Oil */}
              <div>
                <h4 className="font-medium text-black mb-4">Transmission Oil</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil type"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteTransmision.tipo : nuevaMaquina.aceiteTransmision.tipo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteTransmision: { ...maquinaSeleccionada.aceiteTransmision, tipo: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteTransmision: { ...nuevaMaquina.aceiteTransmision, tipo: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Oil brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteTransmision.marca : nuevaMaquina.aceiteTransmision.marca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteTransmision: { ...maquinaSeleccionada.aceiteTransmision, marca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteTransmision: { ...nuevaMaquina.aceiteTransmision, marca: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Capacity in liters"
                      value={modalType === 'editar' ? maquinaSeleccionada.aceiteTransmision.capacidad : nuevaMaquina.aceiteTransmision.capacidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            aceiteTransmision: { ...maquinaSeleccionada.aceiteTransmision, capacidad: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            aceiteTransmision: { ...nuevaMaquina.aceiteTransmision, capacidad: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filtros' && (
            <div className="space-y-6">
              {/* Engine Filter */}
              <div className="border-b pb-6">
                <h4 className="font-medium text-black mb-4">Engine Filter</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Part number"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.motor : nuevaMaquina.filtros.motor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, motor: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, motor: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Filter brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.motorMarca : nuevaMaquina.filtros.motorMarca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, motorMarca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, motorMarca: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Transmission Filter */}
              <div className="border-b pb-6">
                <h4 className="font-medium text-black mb-4">Transmission Filter</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Part number"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.transmision : nuevaMaquina.filtros.transmision}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, transmision: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, transmision: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Filter brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.transmisionMarca : nuevaMaquina.filtros.transmisionMarca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, transmisionMarca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, transmisionMarca: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Fuel Filter */}
              <div>
                <h4 className="font-medium text-black mb-4">Fuel Filter</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Part number"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.combustible : nuevaMaquina.filtros.combustible}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, combustible: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, combustible: value }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Filter brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.filtros.combustibleMarca : nuevaMaquina.filtros.combustibleMarca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            filtros: { ...maquinaSeleccionada.filtros, combustibleMarca: value }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            filtros: { ...nuevaMaquina.filtros, combustibleMarca: value }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'neumaticos' && (
            <div className="space-y-6">
              {/* Front Tires */}
              <div className="border-b pb-6">
                <h4 className="font-medium text-black mb-4">Front Tires</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="E.g.: 12.4-24"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.delanteros.tamano : nuevaMaquina.neumaticos.delanteros.tamano}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              delanteros: { ...maquinaSeleccionada.neumaticos.delanteros, tamano: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              delanteros: { ...nuevaMaquina.neumaticos.delanteros, tamano: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Recommended Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="E.g.: 32"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.delanteros.presion : nuevaMaquina.neumaticos.delanteros.presion}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              delanteros: { ...maquinaSeleccionada.neumaticos.delanteros, presion: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              delanteros: { ...nuevaMaquina.neumaticos.delanteros, presion: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Tire brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.delanteros.marca : nuevaMaquina.neumaticos.delanteros.marca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              delanteros: { ...maquinaSeleccionada.neumaticos.delanteros, marca: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              delanteros: { ...nuevaMaquina.neumaticos.delanteros, marca: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rear Tires */}
              <div>
                <h4 className="font-medium text-black mb-4">Rear Tires</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="E.g.: 18.4-34"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.traseros.tamano : nuevaMaquina.neumaticos.traseros.tamano}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              traseros: { ...maquinaSeleccionada.neumaticos.traseros, tamano: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              traseros: { ...nuevaMaquina.neumaticos.traseros, tamano: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Recommended Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="E.g.: 28"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.traseros.presion : nuevaMaquina.neumaticos.traseros.presion}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              traseros: { ...maquinaSeleccionada.neumaticos.traseros, presion: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              traseros: { ...nuevaMaquina.neumaticos.traseros, presion: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Tire brand"
                      value={modalType === 'editar' ? maquinaSeleccionada.neumaticos.traseros.marca : nuevaMaquina.neumaticos.traseros.marca}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (modalType === 'editar') {
                          setMaquinaSeleccionada({
                            ...maquinaSeleccionada,
                            neumaticos: {
                              ...maquinaSeleccionada.neumaticos,
                              traseros: { ...maquinaSeleccionada.neumaticos.traseros, marca: value }
                            }
                          });
                        } else {
                          setNuevaMaquina({
                            ...nuevaMaquina,
                            neumaticos: {
                              ...nuevaMaquina.neumaticos,
                              traseros: { ...nuevaMaquina.neumaticos.traseros, marca: value }
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={modalType === 'nueva-maquina' ? agregarMaquina : () => {
              const maquinaToUpdate = {
                ...maquinaSeleccionada,
                _id: maquinaSeleccionada._id || maquinaSeleccionada.id // Handle both ID fields
              };
              actualizarMaquina(maquinaToUpdate);
            }}
          >
            {modalType === 'nueva-maquina' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaquinaModal;