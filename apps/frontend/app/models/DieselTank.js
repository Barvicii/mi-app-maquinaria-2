// Frontend model for Diesel Tank
export const DieselTank = {
  // Tank properties
  _id: '',
  name: '',
  capacity: 0, // in liters
  location: '',
  description: '',
  tankId: '', // Custom tank identifier
  workplace: '', // Workplace location
  
  // Ownership and organization
  userId: '',
  credentialId: '',
  organization: '',
  
  // Timestamps
  createdAt: null,
  updatedAt: null,
  
  // Status
  isActive: true
};

// Validation function
export const validateDieselTank = (tank) => {
  const errors = [];
  
  if (!tank.name || typeof tank.name !== 'string' || tank.name.trim() === '') {
    errors.push('Tank name is required and must be a non-empty string');
  }
  
  if (!tank.capacity || isNaN(parseFloat(tank.capacity)) || parseFloat(tank.capacity) <= 0) {
    errors.push('Tank capacity is required and must be a positive number');
  }
  
  if (!tank.location || typeof tank.location !== 'string' || tank.location.trim() === '') {
    errors.push('Tank location is required and must be a non-empty string');
  }
  
  if (!tank.tankId || typeof tank.tankId !== 'string' || tank.tankId.trim() === '') {
    errors.push('Tank ID is required and must be a non-empty string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default DieselTank;
