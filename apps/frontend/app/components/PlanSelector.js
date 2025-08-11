import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import usePrevious from '@/hooks/usePrevious';

/**
 * Componente para seleccionar un plan de suscripción
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onSelect - Función llamada cuando se selecciona un plan
 * @param {String} props.selectedPlan - ID del plan seleccionado actualmente
 * @param {String} props.initialBillingCycle - Ciclo de facturación inicial ('monthly', 'quarterly', 'annual')
 */
export default function PlanSelector({ onSelect, selectedPlan = null, initialBillingCycle = 'monthly' }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState(initialBillingCycle); // 'monthly', 'quarterly', 'annual'
  
  // Usar el hook personalizado para comparar con el valor anterior
  const prevSelectedPlan = usePrevious(selectedPlan);
  const prevBillingCycle = usePrevious(billingCycle);

  // Cargar planes disponibles  
  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        console.log('Intentando cargar planes...');
        
        // Primero intentamos cargar desde /api/plans (endpoint principal)
        const response = await fetch('/api/plans', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar planes desde /api/plans: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Planes cargados desde /api/plans:', data.plans);
        
        if (!data.plans || data.plans.length === 0) {
          throw new Error('No se encontraron planes en /api/plans');
        }
        
        setPlans(data.plans);
        
        // Seleccionar plan recomendado por defecto si no hay uno seleccionado
        if (!selectedPlan) {
          const recommended = data.plans.find(plan => plan.isPopular || plan.recommended);
          if (recommended) {
            onSelect(recommended.id, billingCycle);
          } else if (data.plans.length > 0) {
            onSelect(data.plans[0].id, billingCycle);
          }
        }
      } catch (err) {
        console.error('Error cargando planes desde /api/plans, intentando con /api/subscriptions:', err);
        
        try {
          // Fallback: intentar cargar desde /api/subscriptions
          const subscriptionsResponse = await fetch('/api/subscriptions', {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!subscriptionsResponse.ok) {
            throw new Error(`Error al cargar planes desde /api/subscriptions: ${subscriptionsResponse.status}`);
          }
          
          const subscriptionsData = await subscriptionsResponse.json();
          console.log('Planes cargados desde /api/subscriptions:', subscriptionsData.plans);
          
          if (!subscriptionsData.plans || subscriptionsData.plans.length === 0) {
            throw new Error('No se encontraron planes en /api/subscriptions');
          }
          
          setPlans(subscriptionsData.plans);
          
          if (!selectedPlan) {
            const recommended = subscriptionsData.plans.find(plan => plan.recommended || plan.isPopular);
            if (recommended) {
              onSelect(recommended.id, billingCycle);
            } else if (subscriptionsData.plans.length > 0) {
              onSelect(subscriptionsData.plans[0].id, billingCycle);
            }
          }
        } catch (subscriptionsErr) {
          console.error('Error completo cargando planes:', subscriptionsErr);
          setError('No se pudieron cargar los planes. Por favor, intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlans();
    // Solo cargar planes al montar el componente, sin dependencias adicionales que causen rerenders infinitos
  }, []);  // Cuando cambia el ciclo de facturación, notificar al componente padre,
  // pero solo si cambia el ciclo de facturación, no cuando cambian otras props
  useEffect(() => {
    // Solo notificar cuando el plan ya está seleccionado y hay planes cargados
    // y solo si realmente ha cambiado el valor del ciclo de facturación
    if (selectedPlan && plans.length > 0 && billingCycle !== prevBillingCycle) {
      console.log(`Notificando cambio de ciclo: ${prevBillingCycle} -> ${billingCycle}`);
      onSelect(selectedPlan, billingCycle);
    }
  }, [billingCycle, selectedPlan, plans, onSelect, prevBillingCycle]); // Incluir prevBillingCycle

  // Calcular el precio con descuento según el ciclo de facturación
  const calculatePrice = (basePrice) => {
    if (billingCycle === 'quarterly') {
      // 10% de descuento para trimestral
      return (basePrice * 0.9).toFixed(2);
    } else if (billingCycle === 'annual') {
      // 25% de descuento para anual
      return (basePrice * 0.75).toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  // Calcular el precio total según el ciclo de facturación
  const calculateTotalPrice = (basePrice) => {
    if (billingCycle === 'quarterly') {
      // Precio trimestral (3 meses con 10% descuento)
      return (basePrice * 3 * 0.9).toFixed(2);
    } else if (billingCycle === 'annual') {
      // Precio anual (12 meses con 25% descuento)
      return (basePrice * 12 * 0.75).toFixed(2);
    }
    // Precio mensual sin descuento
    return basePrice.toFixed(2);
  };

  // Calcular el precio mensual según el ciclo de facturación
  const calculateMonthlyPrice = (basePrice) => {
    if (billingCycle === 'quarterly') {
      // Precio mensual en ciclo trimestral
      return ((basePrice * 3 * 0.9) / 3).toFixed(2);
    } else if (billingCycle === 'annual') {
      // Precio mensual en ciclo anual
      return ((basePrice * 12 * 0.75) / 12).toFixed(2);
    }
    // Precio mensual regular
    return basePrice.toFixed(2);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading available plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Selector de ciclo de facturación */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700`}
            onClick={() => {
              if (billingCycle !== 'monthly') {
                setBillingCycle('monthly');
              }
            }}
          >
            Mensual
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              billingCycle === 'quarterly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-r border-gray-300 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700`}
            onClick={() => {
              if (billingCycle !== 'quarterly') {
                setBillingCycle('quarterly');
              }
            }}
          >
            Trimestral
            <span className="ml-1 text-xs font-semibold text-green-600">10% dto.</span>
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700`}
            onClick={() => {
              if (billingCycle !== 'annual') {
                setBillingCycle('annual');
              }
            }}
          >
            Anual
            <span className="ml-1 text-xs font-semibold text-green-600">25% dto.</span>
          </button>
        </div>
      </div>      {/* Tarjetas de planes */}
      <div className="grid grid-cols-1 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg overflow-hidden ${
              selectedPlan === plan.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            } transition-all`}
          >
            {/* Encabezado del plan */}
            <div 
              className={`px-6 py-4 border-b ${
                selectedPlan === plan.id ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-1">
                {plan.price > 0 ? (
                  <>
                    <span className="text-2xl font-bold">${calculateMonthlyPrice(plan.price)}</span>
                    <span className="text-gray-500 text-sm">/mes</span>
                    {billingCycle !== 'monthly' && (
                      <div className="text-sm text-gray-600 mt-1">
                        Total: ${calculateTotalPrice(plan.price)} por {billingCycle === 'quarterly' ? 'trimestre' : 'año'}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold">Gratis</span>
                )}
              </div>
              {plan.recommended && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Recomendado
                  </span>
                </div>
              )}
              {plan.badge && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {plan.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Características del plan */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              
              <ul className="space-y-3">                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.machines ? (
                      plan.features.machines === 'unlimited' 
                        ? 'Máquinas ilimitadas' 
                        : `${plan.features.machines} máquinas`
                    ) : 'Máquinas no especificadas'}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.operators ? (
                      plan.features.operators === 'unlimited' 
                        ? 'Operadores ilimitados' 
                        : `${plan.features.operators} operadores`
                    ) : 'Operadores no especificados'}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.users ? (
                      plan.features.users === 'unlimited' 
                        ? 'Usuarios ilimitados' 
                        : `${plan.features.users} usuarios`
                    ) : 'Usuarios no especificados'}
                  </span>
                </li>                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.prestartTemplates ? (
                      plan.features.prestartTemplates === 'unlimited' 
                        ? 'Plantillas ilimitadas' 
                        : `${plan.features.prestartTemplates} plantillas prestart`
                    ) : 'Plantillas prestart no especificadas'}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.storage ? 
                      `${plan.features.storage / 1000} GB almacenamiento` : 
                      'Almacenamiento no especificado'}
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">
                    {plan.features && plan.features.support ? 
                      `Soporte ${plan.features.support === 'dedicated' 
                        ? 'dedicado' 
                        : plan.features.support === 'priority' 
                          ? 'prioritario' 
                          : 'por email'}`
                      : 'Soporte estándar'}
                  </span>
                </li>
                {plan.features.reporting && (
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Reportes avanzados</span>
                  </li>
                )}
                {plan.features.api && (
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Acceso a API</span>
                  </li>
                )}
                {plan.features.customBranding && (
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Personalización de marca</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Botón de selección */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">              <button
                type="button"
                className={`w-full py-2 px-4 rounded-md ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  // Solo llamar a onSelect si realmente cambia la selección
                  if (selectedPlan !== plan.id) {
                    onSelect(plan.id, billingCycle);
                  }
                }}
              >
                {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

