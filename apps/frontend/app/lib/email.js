// Configuración de SendGrid para envío de emails
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@orchardservices.co.nz';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Orchard Service';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@orchardservices.co.nz';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contact@orchardservices.co.nz';
const WEBSITE_URL = process.env.NEXTAUTH_URL || 'https://orchardservices.co.nz';

// Función para enviar emails usando SendGrid API REST
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key is not configured');
  }

  const emailData = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject
      }
    ],
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    content: [
      {
        type: 'text/html',
        value: html
      }
    ]
  };

  if (text) {
    emailData.content.unshift({
      type: 'text/plain',
      value: text
    });
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('SendGrid API error:', response.status, errorData);
      throw new Error(`SendGrid API error: ${response.status} ${errorData}`);
    }

    console.log('✅ Email sent successfully via SendGrid');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Verificar la configuración de SendGrid
export const verifyEmailConnection = async () => {
  try {
    if (!SENDGRID_API_KEY) {
      console.log('❌ SendGrid API key is not configured');
      return false;
    }
    
    // Verificar que el API key sea válido haciendo una llamada de prueba
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      console.log('✅ SendGrid connection verified successfully');
      return true;
    } else {
      console.log('❌ SendGrid API key verification failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error verifying SendGrid connection:', error);
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
