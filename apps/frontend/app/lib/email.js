import nodemailer from 'nodemailer';

// Configuración de email - Gmail SMTP (gratis, 500 emails/día)
const EMAIL_USER = process.env.EMAIL_USER || 'orchardservices96@gmail.com';
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Orchard Services';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'orchardservices96@gmail.com';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'orchardservices96@gmail.com';
const WEBSITE_URL = process.env.NEXTAUTH_URL || 'https://orchardservices.co.nz';

// Crear transporter de Nodemailer con Gmail SMTP
const createTransporter = () => {
  if (!EMAIL_APP_PASSWORD) {
    throw new Error('EMAIL_APP_PASSWORD is not configured. Generate one at https://myaccount.google.com/apppasswords');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
};

// Función principal para enviar emails
export const sendEmail = async ({ to, subject, html, text }) => {
  const transport = createTransporter();

  const mailOptions = {
    from: `"${FROM_NAME}" <${EMAIL_USER}>`,
    to,
    subject,
    html,
    ...(text && { text }),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Gmail SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email via Gmail SMTP:', error.message);
    throw error;
  }
};

// Verificar la conexión de email
export const verifyEmailConnection = async () => {
  try {
    if (!EMAIL_APP_PASSWORD) {
      console.log('❌ EMAIL_APP_PASSWORD is not configured');
      return false;
    }

    const transport = createTransporter();
    await transport.verify();
    console.log('✅ Gmail SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.log('❌ Error verifying Gmail SMTP connection:', error.message);
    return false;
  }
};

// Mantener compatibilidad con código existente
export const transporter = {
  sendMail: async (mailOptions) => {
    return await sendEmail({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text
    });
  }
};
