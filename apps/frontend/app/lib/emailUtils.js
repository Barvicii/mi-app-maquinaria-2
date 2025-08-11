import { sendEmail } from './email.js';
import { temporaryPasswordTemplate, resetPasswordTemplate, verificationCodeTemplate, userInvitationTemplate } from './emailTemplates.js';

// Generar contraseña temporal aleatoria
export const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generar token de reset
export const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generar código de verificación
export const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Enviar email de contraseña temporal
export const sendTemporaryPasswordEmail = async (email, name, temporaryPassword) => {
  try {
    console.log(`📧 Enviando email de contraseña temporal a: ${email}`);
    console.log(`👤 Nombre: ${name}`);
    console.log(`🔑 Contraseña temporal: ${temporaryPassword}`);
    
    const result = await sendEmail({
      to: email,
      subject: 'Your Temporary Password - Orchard Services',
      html: temporaryPasswordTemplate(name || 'User', temporaryPassword)
    });

    console.log('✅ Email de contraseña temporal enviado');
    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('❌ Error al enviar email de contraseña temporal:', error);
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

    console.log('✅ Password reset email sent');
    console.log('🔗 Reset URL:', resetUrl);
    console.log('📧 Email sent to:', email);
    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
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

    console.log('✅ Email de verificación enviado');
    return { success: true, messageId: 'sent' };
  } catch (error) {
    console.error('❌ Error al enviar email de verificación:', error);
    return { success: false, error: error.message };
  }
};

// Enviar email de invitación de usuario
export const sendUserInvitationEmail = async (email, temporaryPassword) => {
  try {
    console.log(`📧 Enviando email de invitación a: ${email}`);
    console.log(`🔑 Contraseña temporal: ${temporaryPassword}`);
    
    const loginUrl = `https://orchardservices.co.nz/login`;
    console.log(`🔗 Login URL: ${loginUrl}`);
    
    console.log('📝 Generando template HTML...');
    const htmlContent = userInvitationTemplate(email, temporaryPassword, loginUrl);
    console.log(`📏 Template generado, longitud: ${htmlContent.length} caracteres`);
    
    console.log('📤 Llamando a sendEmail...');
    const result = await sendEmail({
      to: email,
      subject: 'Invitation to Orchard Services',
      html: htmlContent
    });

    console.log('✅ Email de invitación enviado exitosamente');
    
    return {
      success: true,
      messageId: 'sent',
      message: 'Invitation email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error enviando email de invitación:', error);
    console.error('❌ Stack trace:', error.stack);
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
