// Configuración de planes de suscripción
export const plans = {
  free: {
    name: 'Plan Gratuito',
    price: 0,
    billingCycle: 'monthly',
    description: 'Perfecto para empezar con funcionalidades básicas',
    features: [
      'Hasta 5 máquinas',
      'Hasta 3 usuarios',
      'Plantillas básicas de prestart',
      '1 GB de almacenamiento',
      'Soporte por email'
    ]
  },
  basic: {
    name: 'Plan Básico',
    price: 29,
    billingCycle: 'monthly',
    description: 'Ideal para pequeñas empresas con necesidades estándar',
    features: [
      'Hasta 15 máquinas',
      'Hasta 10 usuarios',
      'Plantillas avanzadas de prestart',
      '5 GB de almacenamiento',
      'Reportes básicos',
      'Soporte prioritario'
    ]
  },
  professional: {
    name: 'Plan Profesional',
    price: 79,
    billingCycle: 'monthly',
    description: 'Para empresas en crecimiento que necesitan más funcionalidades',
    features: [
      'Hasta 50 máquinas',
      'Hasta 25 usuarios',
      'Plantillas ilimitadas de prestart',
      '20 GB de almacenamiento',
      'Reportes avanzados',
      'Acceso a API',
      'Soporte prioritario'
    ]
  },
  enterprise: {
    name: 'Plan Empresarial',
    price: 199,
    billingCycle: 'monthly',
    description: 'Solución completa para grandes empresas',
    features: [
      'Máquinas ilimitadas',
      'Usuarios ilimitados',
      'Plantillas personalizadas',
      '100 GB de almacenamiento',
      'Reportes personalizados',
      'Acceso completo a API',
      'Soporte dedicado',
      'Personalización de marca'
    ]
  }
};

export const planConfig = {
  defaultPlan: 'free',
  trialPeriod: 14, // días
  billingCycles: ['monthly', 'quarterly', 'annual'],
  discounts: {
    quarterly: 0.1, // 10% descuento
    annual: 0.25    // 25% descuento
  }
};

// Función helper para obtener un plan por ID
export function getPlanById(planId) {
  return plans[planId] || null;
}

// Función helper para obtener todos los planes activos
export function getActivePlans() {
  return Object.entries(plans).map(([id, plan]) => ({
    id,
    ...plan
  }));
}

// Función helper para calcular precio con descuento
export function calculateDiscountedPrice(planId, billingCycle = 'monthly') {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  const basePrice = plan.price;
  const discount = planConfig.discounts[billingCycle] || 0;
  
  return basePrice * (1 - discount);
}
