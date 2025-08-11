// src/hooks/usePrevious.js
import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para guardar el valor anterior de una variable
 * @param {any} value - El valor a almacenar
 * @returns {any} El valor anterior
 */
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

export default usePrevious;
