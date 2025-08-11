const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// Función para obtener el transportador de email adecuado
function getEmailProvider() {
  // Si hay una API Key de SendGrid disponible, usarla
  if (process.env.SENDGRID_API_KEY) {
    console.log('Using SendGrid email provider');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return 'sendgrid';
  } 
  // Si hay configuración SMTP, usar nodemailer
  else if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    console.log('Using SMTP email provider');
    return 'smtp';
  } 
  // Usar Ethereal para desarrollo
  else {
    console.log('Using test email account for development');
    return 'ethereal';
  }
}

// Función para enviar email con el proveedor apropiado
async function sendEmail(recipient, subject, htmlContent, textContent) {
  const provider = getEmailProvider();
  const fromEmail = process.env.EMAIL_FROM || 'no-reply@orchardservice.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Orchard Service';
  
  try {
    // Usar SendGrid
    if (provider === 'sendgrid') {
      const msg = {
        to: recipient,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: subject,
        text: textContent,
        html: htmlContent,
      };
      
      const response = await sgMail.send(msg);
      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'] || 'sent',
        provider: 'sendgrid'
      };
    }
    // Usar SMTP configurado
    else if (provider === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      
      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp'
      };
    }
    // Usar Ethereal para desarrollo
    else {
      // Crear cuenta de prueba Ethereal
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      
      console.log('Test email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        provider: 'ethereal'
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
      provider: provider
    };
  }
}

// Plantilla para aprobación de solicitud
function getApprovalEmailTemplate(user, tempPassword, appUrl) {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(tempPassword)}&email=${encodeURIComponent(user.email)}`;
  
  return {
    subject: 'Su solicitud ha sido aprobada - Orchard Service',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solicitud Aprobada</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header { 
            background-color: #4a6cf7;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
            border: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .credentials {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Solicitud Aprobada!</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${user.name}</strong>,</p>
          
          <p>Nos complace informarle que su solicitud de acceso a <strong>Orchard Service</strong> ha sido aprobada.</p>
          
          <p>Para completar su registro y acceder a la plataforma, puede utilizar las siguientes credenciales temporales:</p>
          
          <div class="credentials">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
          </div>
          
          <p>Por motivos de seguridad, le recomendamos cambiar su contraseña después de iniciar sesión por primera vez.</p>
          
          <p>Para acceder a la plataforma, haga clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="${appUrl}/login" class="button">Iniciar Sesión</a>
          </div>
          
          <p>O puede utilizar el siguiente enlace para establecer una nueva contraseña directamente:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Establecer Contraseña</a>
          </div>
          
          <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
          
          <p>Saludos cordiales,<br>
          El equipo de Orchard Service</p>
        </div>
        
        <div class="footer">
          <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} Orchard Service. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      ¡Solicitud Aprobada!
      
      Estimado/a ${user.name},
      
      Nos complace informarle que su solicitud de acceso a Orchard Service ha sido aprobada.
      
      Para completar su registro y acceder a la plataforma, puede utilizar las siguientes credenciales temporales:
      
      Email: ${user.email}
      Contraseña temporal: ${tempPassword}
      
      Por motivos de seguridad, le recomendamos cambiar su contraseña después de iniciar sesión por primera vez.
      
      Para acceder a la plataforma, visite: ${appUrl}/login
      
      O puede establecer una nueva contraseña directamente en: ${resetUrl}
      
      Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.
      
      Saludos cordiales,
      El equipo de Orchard Service
      
      Este es un mensaje automático, por favor no responda a este correo.
      © ${new Date().getFullYear()} Orchard Service. Todos los derechos reservados.
    `
  };
}

// Plantilla para rechazo de solicitud
function getRejectionEmailTemplate(user, reason, appUrl) {
  return {
    subject: 'Actualización sobre su solicitud - Orchard Service',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Solicitud</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header { 
            background-color: #6c757d;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
            border: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .reason {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Actualización sobre su Solicitud</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${user.name}</strong>,</p>
          
          <p>Gracias por su interés en <strong>Orchard Service</strong>.</p>
          
          <p>Hemos revisado su solicitud de acceso y lamentamos informarle que no podemos aprobarla en este momento.</p>
          
          ${reason ? `
          <div class="reason">
            <p><strong>Motivo:</strong> ${reason}</p>
          </div>
          ` : ''}
          
          <p>Si cree que ha habido un error o si desea enviar información adicional para reconsiderar su solicitud, no dude en contactarnos.</p>
          
          <div style="text-align: center;">
            <a href="${appUrl}/contact" class="button">Contactar Soporte</a>
          </div>
          
          <p>Agradecemos su comprensión.</p>
          
          <p>Saludos cordiales,<br>
          El equipo de Orchard Service</p>
        </div>
        
        <div class="footer">
          <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} Orchard Service. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Actualización sobre su Solicitud
      
      Estimado/a ${user.name},
      
      Gracias por su interés en Orchard Service.
      
      Hemos revisado su solicitud de acceso y lamentamos informarle que no podemos aprobarla en este momento.
      
      ${reason ? `Motivo: ${reason}` : ''}
      
      Si cree que ha habido un error o si desea enviar información adicional para reconsiderar su solicitud, no dude en contactarnos.
      
      Para contactar con soporte, visite: ${appUrl}/contact
      
      Agradecemos su comprensión.
      
      Saludos cordiales,
      El equipo de Orchard Service
      
      Este es un mensaje automático, por favor no responda a este correo.
      © ${new Date().getFullYear()} Orchard Service. Todos los derechos reservados.
    `
  };
}

// Función para enviar email de aprobación
async function sendApprovalEmail(user, tempPassword) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const { subject, html, text } = getApprovalEmailTemplate(user, tempPassword, appUrl);
    
    return await sendEmail(user.email, subject, html, text);
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar email de rechazo
async function sendRejectionEmail(user, reason) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const { subject, html, text } = getRejectionEmailTemplate(user, reason, appUrl);
    
    return await sendEmail(user.email, subject, html, text);
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar alerta de prestart que requiere revisión
async function sendPrestartReviewEmail(userEmail, userName, machineId, machineName, prestartDate) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const subject = '🚨 Pre-Start Check Requires Review';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin: 0; font-size: 24px;">⚠️ Pre-Start Check Review Required</h1>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">A pre-start check for one of your machines requires immediate attention:</p>
          
          <div style="background-color: #fff5f5; padding: 20px; border-left: 4px solid #e74c3c; margin: 25px 0; border-radius: 5px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Machine:</td>
                <td style="padding: 5px 0; color: #333;">${machineName} (${machineId})</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Check Date:</td>
                <td style="padding: 5px 0; color: #333;">${prestartDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Status:</td>
                <td style="padding: 5px 0; color: #e74c3c; font-weight: bold;">Needs Review</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Please log into your dashboard to review the issues found during the pre-start check.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard" 
               style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
            This is an automated alert from your Machinery Management System.<br>
            © ${new Date().getFullYear()} Orchard Service. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      Pre-Start Check Review Required
      
      Hello ${userName},
      
      A pre-start check for one of your machines requires immediate attention:
      
      Machine: ${machineName} (${machineId})
      Check Date: ${prestartDate}
      Status: Needs Review
      
      Please log into your dashboard to review the issues found during the pre-start check.
      
      View Dashboard: ${appUrl}/dashboard
      
      This is an automated alert from your Machinery Management System.
    `;
    
    return await sendEmail(userEmail, subject, html, text);
  } catch (error) {
    console.error('Error sending prestart review email:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar alerta de service/mantenimiento
async function sendServiceReminderEmail(userEmail, userName, machineId, machineName, currentHours, nextServiceHours) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const hoursRemaining = nextServiceHours - currentHours;
    
    const subject = '🔧 Machine Service Reminder';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f39c12; margin: 0; font-size: 24px;">🔧 Machine Service Reminder</h1>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">One of your machines is approaching its scheduled service time:</p>
          
          <div style="background-color: #fefcf5; padding: 20px; border-left: 4px solid #f39c12; margin: 25px 0; border-radius: 5px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Machine:</td>
                <td style="padding: 5px 0; color: #333;">${machineName} (${machineId})</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Current Hours:</td>
                <td style="padding: 5px 0; color: #333;">${currentHours}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Next Service:</td>
                <td style="padding: 5px 0; color: #333;">${nextServiceHours} hours</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">Hours Remaining:</td>
                <td style="padding: 5px 0; color: ${hoursRemaining <= 10 ? '#e74c3c' : '#f39c12'}; font-weight: bold;">${hoursRemaining} hours</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Please schedule the service to ensure optimal machine performance and prevent breakdowns.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard" 
               style="background-color: #f39c12; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
            This is an automated reminder from your Machinery Management System.<br>
            © ${new Date().getFullYear()} Orchard Service. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      Machine Service Reminder
      
      Hello ${userName},
      
      One of your machines is approaching its scheduled service time:
      
      Machine: ${machineName} (${machineId})
      Current Hours: ${currentHours}
      Next Service: ${nextServiceHours} hours
      Hours Remaining: ${hoursRemaining} hours
      
      Please schedule the service to ensure optimal machine performance and prevent breakdowns.
      
      View Dashboard: ${appUrl}/dashboard
      
      This is an automated reminder from your Machinery Management System.
    `;
    
    return await sendEmail(userEmail, subject, html, text);
  } catch (error) {
    console.error('Error sending service reminder email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendPrestartReviewEmail,
  sendServiceReminderEmail
};