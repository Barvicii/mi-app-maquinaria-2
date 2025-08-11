/**
 * HOOKS PERSONALIZADOS OPTIMIZADOS
 * Para máximo rendimiento y reutilización
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Hook optimizado para fetch con cache
export const useFetchWithCache = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());

  const fetchData = useCallback(async () => {
    // Verificar cache primero
    if (cacheRef.current.has(url)) {
      const cachedData = cacheRef.current.get(url);
      // Cache válido por 5 minutos
      if (Date.now() - cachedData.timestamp < 300000) {
        setData(cachedData.data);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Guardar en cache
      cacheRef.current.set(url, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Limpiar cache y refetch
    cacheRef.current.delete(url);
    fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refetch };
};

// Hook optimizado para debounce
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook optimizado para paginación
export const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Hook optimizado para filtros
export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const filterData = useCallback((data, customFilterFn) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      if (customFilterFn) {
        return customFilterFn(item, filters);
      }
      
      // Filtro por defecto
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value.trim() === '') return true;
        
        const itemValue = item[key];
        if (!itemValue) return false;
        
        return itemValue.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value && value.toString().trim() !== ''
    ).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filterData,
    activeFiltersCount
  };
};

// Hook optimizado para manejo de notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

// Hook optimizado para viewport
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewport.width < 768;
  const isTablet = viewport.width >= 768 && viewport.width < 1024;
  const isDesktop = viewport.width >= 1024;

  return {
    ...viewport,
    isMobile,
    isTablet,
    isDesktop
  };
};

// Hook optimizado para storage local
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};
