import validator from 'validator';

/**
 * Utilidades de validación y sanitización
 */

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Sanitizar strings para prevenir XSS
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .substring(0, 1000); // Limitar longitud
}

// Validar email
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email');
  }
  
  const sanitizedEmail = sanitizeString(email).toLowerCase();
  
  if (!validator.isEmail(sanitizedEmail)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  
  if (sanitizedEmail.length > 254) {
    throw new ValidationError('Email too long', 'email');
  }
  
  return sanitizedEmail;
}

// Validar contraseña
export function validatePassword(password, minLength = 8) {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password');
  }
  
  if (password.length < minLength) {
    throw new ValidationError(`Password must be at least ${minLength} characters`, 'password');
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password too long', 'password');
  }
  
  // Verificar que contenga al menos una letra y un número
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError('Password must contain at least one letter and one number', 'password');
  }
  
  return password;
}

// Validar ObjectId de MongoDB
export function validateObjectId(id, fieldName = 'id') {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
  
  return id;
}

// Validar string general
export function validateString(str, fieldName, options = {}) {
  const { minLength = 1, maxLength = 255, required = true } = options;
  
  if (!str && required) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  if (!str && !required) {
    return '';
  }
  
  if (typeof str !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  
  const sanitized = sanitizeString(str);
  
  if (sanitized.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
  }
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`, fieldName);
  }
  
  return sanitized;
}

// Validar número
export function validateNumber(num, fieldName, options = {}) {
  const { min, max, required = true } = options;
  
  if (num === undefined || num === null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return undefined;
  }
  
  const parsed = Number(num);
  
  if (isNaN(parsed)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
  }
  
  if (min !== undefined && parsed < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName);
  }
  
  if (max !== undefined && parsed > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName);
  }
  
  return parsed;
}

// Validar datos de usuario
export function validateUserData(data) {
  const validated = {};
  
  if (data.email !== undefined) {
    validated.email = validateEmail(data.email);
  }
  
  if (data.password !== undefined) {
    validated.password = validatePassword(data.password);
  }
  
  if (data.name !== undefined) {
    validated.name = validateString(data.name, 'name', { 
      minLength: 2, 
      maxLength: 100,
      required: false 
    });
  }
  
  if (data.organization !== undefined) {
    validated.organization = validateString(data.organization, 'organization', { 
      minLength: 2, 
      maxLength: 100,
      required: false 
    });
  }
  
  if (data.role !== undefined) {
    const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(data.role)) {
      throw new ValidationError('Invalid role', 'role');
    }
    validated.role = data.role;
  }
  
  return validated;
}

// Sanitizar objeto completo
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
