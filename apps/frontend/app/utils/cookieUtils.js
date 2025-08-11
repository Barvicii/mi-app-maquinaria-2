// Utilidad para manejar cookies de credenciales de forma segura
// Solo guarda email, NO la contraseña por seguridad

const CREDENTIALS_COOKIE = 'remembered_email';
const REMEMBER_CHECKBOX_COOKIE = 'remember_me_checked';

export const cookieUtils = {
  // Guardar solo el email cuando "Remember me" está activado
  saveRememberedEmail: (email) => {
    try {
      // Cookie expira en 30 días
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      document.cookie = `${CREDENTIALS_COOKIE}=${encodeURIComponent(email)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
      document.cookie = `${REMEMBER_CHECKBOX_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
    } catch (error) {
      console.error('Error saving remembered email:', error);
    }
  },

  // Recuperar email guardado
  getRememberedEmail: () => {
    try {
      const emailCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${CREDENTIALS_COOKIE}=`));
      
      const rememberCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${REMEMBER_CHECKBOX_COOKIE}=`));

      if (emailCookie && rememberCookie) {
        const email = decodeURIComponent(emailCookie.split('=')[1]);
        return {
          email,
          rememberMe: true
        };
      }
      
      return {
        email: '',
        rememberMe: false
      };
    } catch (error) {
      console.error('Error getting remembered email:', error);
      return {
        email: '',
        rememberMe: false
      };
    }
  },

  // Limpiar credenciales guardadas
  clearRememberedCredentials: () => {
    try {
      document.cookie = `${CREDENTIALS_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
      document.cookie = `${REMEMBER_CHECKBOX_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
    } catch (error) {
      console.error('Error clearing remembered credentials:', error);
    }
  }
};
