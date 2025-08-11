/**
 * LAZY LOADING DE COMPONENTES PARA RENDIMIENTO MÁXIMO
 * Carga componentes solo cuando son necesarios
 */

import { lazy, Suspense, Component } from 'react';

// Componentes pesados con lazy loading
export const LazyTabReports = lazy(() => import('../TabReports'));
export const LazyTabServices = lazy(() => import('../TabServices'));
export const LazyTabPreStart = lazy(() => import('../TabPreStart'));
export const LazyTabUsers = lazy(() => import('../TabUsers'));
export const LazyTabMachinary = lazy(() => import('../TabMachinary'));
export const LazyDieselHistory = lazy(() => import('../DieselHistory'));
export const LazyReports = lazy(() => import('../Reports'));
export const LazyPreStartTemplateManager = lazy(() => import('../PreStartTemplateManager'));

// Componentes de dashboard con lazy loading
export const LazyDashboard = lazy(() => import('../Dashboard'));
export const LazyChartContainer = lazy(() => import('../dashboard/ChartContainer'));

// Componentes de formularios pesados
export const LazyServiceForm = lazy(() => import('../ServiceForm'));
export const LazyPreStartCheckForm = lazy(() => import('../PreStartCheckForm'));
export const LazyDieselForm = lazy(() => import('../DieselForm'));

// Loading spinner optimizado
export const OptimizedSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

// HOC para wrappear componentes con Suspense
export const withLazyLoading = (LazyComponent, fallback = <OptimizedSpinner />) => {
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

// Componentes ya envueltos para uso directo
export const LazyTabReportsWithSuspense = withLazyLoading(LazyTabReports);
export const LazyTabServicesWithSuspense = withLazyLoading(LazyTabServices);
export const LazyTabPreStartWithSuspense = withLazyLoading(LazyTabPreStart);
export const LazyTabUsersWithSuspense = withLazyLoading(LazyTabUsers);
export const LazyTabMachinaryWithSuspense = withLazyLoading(LazyTabMachinary);
export const LazyDieselHistoryWithSuspense = withLazyLoading(LazyDieselHistory);
export const LazyReportsWithSuspense = withLazyLoading(LazyReports);
export const LazyPreStartTemplateManagerWithSuspense = withLazyLoading(LazyPreStartTemplateManager);
export const LazyDashboardWithSuspense = withLazyLoading(LazyDashboard);
export const LazyChartContainerWithSuspense = withLazyLoading(LazyChartContainer);
export const LazyServiceFormWithSuspense = withLazyLoading(LazyServiceForm);
export const LazyPreStartCheckFormWithSuspense = withLazyLoading(LazyPreStartCheckForm);
export const LazyDieselFormWithSuspense = withLazyLoading(LazyDieselForm);

// Error boundary para componentes lazy
export class LazyLoadErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 text-red-600">
          <p>Error al cargar el componente. Por favor, recarga la página.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
