export const updateNestedState = (prev, name, value) => {
  const parts = name.split('.');
  if (parts.length === 1) return { ...prev, [name]: value };
  
  let current = prev;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  
  const lastPart = parts[parts.length - 1];
  const updatedNested = { ...current, [lastPart]: value };
  
  return updateParentObject(prev, parts.slice(0, -1), updatedNested);
};

export const cleanFormData = (data) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value !== null) {
      const cleaned = cleanFormData(value);
      if (Object.keys(cleaned).length > 0) {
        acc[key] = cleaned;
      }
    } else if (value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const mapMachineDataToForm = (machine) => {
  // Add your mapping logic here
  return {
    model: machine.model || machine.modelo || '',
    brand: machine.brand || machine.marca || '',
    // ... map other fields
  };
};