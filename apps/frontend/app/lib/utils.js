/**
 * Genera una contraseña aleatoria segura
 * @param {number} length - Longitud de la contraseña (por defecto 12)
 * @returns {string} - Contraseña generada
 */
export function generatePassword(length = 12) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Asegurar que hay al menos uno de cada tipo
  let password = '';
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Completar el resto de la contraseña con caracteres aleatorios
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Formatea una fecha para mostrarla
 * @param {Date|string} date - Fecha a formatear
 * @param {boolean} includeTime - Si se debe incluir la hora
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, includeTime = false) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  
  return dateObj.toLocaleDateString(undefined, options);
}