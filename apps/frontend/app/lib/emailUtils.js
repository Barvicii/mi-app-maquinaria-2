import crypto from 'crypto';
import { sendEmail } from './email.js';
import { temporaryPasswordTemplate, resetPasswordTemplate, verificationCodeTemplate, userInvitationTemplate } from './emailTemplates.js';

// Cryptographically secure Fisher-Yates shuffle
const secureShuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generate cryptographically secure temporary password
export const generateTemporaryPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  
  // Ensure at least one of each type
  const password = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
  ];
  
  // Fill remaining characters
  const allChars = upper + lower + digits;
  for (let i = password.length; i < 12; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }
  
  return secureShuffleArray(password).join('');
};

// Generate cryptographically secure reset token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate cryptographically secure verification code
export const generateVerificationCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 6);
};

// Enviar email de contraseña temporal
export const sendTemporaryPasswordEmail = async (email, name, temporaryPassword) => {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Your Temporary Password - Orchard Services',
      html: temporaryPasswordTemplate(name || 'User', temporaryPassword)
    });

    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('[EMAIL] Error sending temporary password email:', error.message);
    return { success: false, error: error.message };
  }
};

// Enviar email de reset de contraseña
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Use environment variable for base URL
    // First try NEXT_PUBLIC_APP_URL, then NEXT_PUBLIC_SITE_URL, then fallback to production URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_SITE_URL || 
                   'https://orchardservices.co.nz';
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const result = await sendEmail({
      to: email,
      subject: 'Reset Password - Orchard Services',
      html: resetPasswordTemplate(resetUrl)
    });

    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('[EMAIL] Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

// Enviar email de verificación
export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Verifica tu email - Orchard Services',
      html: verificationCodeTemplate(verificationCode)
    });

    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('[EMAIL] Error sending verification email:', error.message);
    return { success: false, error: error.message };
  }
};

// Enviar email de invitación de usuario
export const sendUserInvitationEmail = async (email, temporaryPassword) => {
  try {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_SITE_URL || 
                     'https://orchardservices.co.nz';
    const loginPage = `${loginUrl}/login`;
    
    const htmlContent = userInvitationTemplate(email, temporaryPassword, loginPage);
    
    const result = await sendEmail({
      to: email,
      subject: 'Invitation to Orchard Services',
      html: htmlContent
    });

    return {
      success: true,
      messageId: 'sent',
      message: 'Invitation email sent successfully'
    };
  } catch (error) {
    console.error('[EMAIL] Error sending invitation email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para testear la conexión de email
export const testEmailConnection = async () => {
  try {
    const { verifyEmailConnection } = await import('./email.js');
    const result = await verifyEmailConnection();
    return result ? { success: true, message: 'Conexión SendGrid establecida correctamente' } : { success: false, error: 'Fallo en verificación' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
