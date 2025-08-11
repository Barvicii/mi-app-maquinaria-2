import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  organizationSuspended: (organizationName, adminName) => ({
    subject: `Organization Suspended - ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0;">🚫 Organization Suspended</h2>
          <p style="margin: 0; color: #374151;">
            Your organization <strong>${organizationName}</strong> has been suspended by the system administrator.
          </p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">What this means:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>All users in your organization will be unable to access the system</li>
            <li>Existing sessions will be terminated</li>
            <li>Data remains secure and intact</li>
          </ul>
        </div>
        
        <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">Next steps:</h3>
          <p style="color: #6b7280; margin: 0;">
            Please contact your system administrator or support team for more information about this suspension.
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Action performed by: ${adminName}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  }),

  organizationUnsuspended: (organizationName, adminName) => ({
    subject: `Organization Reactivated - ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #16a34a; margin: 0 0 15px 0;">✅ Organization Reactivated</h2>
          <p style="margin: 0; color: #374151;">
            Your organization <strong>${organizationName}</strong> has been reactivated and you can now access the system again.
          </p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">You can now:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Log back into the system</li>
            <li>Access all your data and functionality</li>
            <li>Resume normal operations</li>
          </ul>
        </div>
        
        <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #6b7280; margin: 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In Now
            </a>
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Action performed by: ${adminName}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  })
};

// Send suspension notification emails
export const sendSuspensionNotification = async (users, organizationName, adminName, isSuspended) => {
  try {
    const transporter = createTransporter();
    const template = isSuspended 
      ? emailTemplates.organizationSuspended(organizationName, adminName)
      : emailTemplates.organizationUnsuspended(organizationName, adminName);

    const emailPromises = users.map(user => {
      if (!user.email) return Promise.resolve();
      
      return transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      });
    });

    await Promise.allSettled(emailPromises);
    console.log(`📧 Email notifications sent to ${users.length} users for organization ${organizationName}`);
    
    return { success: true, emailsSent: users.length };
  } catch (error) {
    console.error('Error sending suspension notification emails:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification
export const sendAdminNotification = async (adminEmail, organizationName, usersAffected, isSuspended) => {
  try {
    const transporter = createTransporter();
    const action = isSuspended ? 'suspended' : 'reactivated';
    
    const adminTemplate = {
      subject: `Organization ${action.charAt(0).toUpperCase() + action.slice(1)} - ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #374151;">Admin Notification</h2>
          <p>Organization <strong>${organizationName}</strong> has been successfully ${action}.</p>
          <p><strong>Users affected:</strong> ${usersAffected}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: adminTemplate.subject,
      html: adminTemplate.html
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
};

// Send prestart review alert email
export const sendPrestartReviewAlert = async (userEmail, userName, machineId, machineName, prestartDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'alerts@machinery-app.com',
      to: userEmail,
      subject: '🚨 Machine Pre-Start Check Requires Review',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">⚠️ Pre-Start Check Review Required</h2>
          
          <p>Hello ${userName},</p>
          
          <p>A pre-start check for one of your machines requires immediate attention:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <strong>Machine:</strong> ${machineName} (${machineId})<br>
            <strong>Check Date:</strong> ${prestartDate}<br>
            <strong>Status:</strong> <span style="color: #e74c3c;">Needs Review</span>
          </div>
          
          <p>Please log into your dashboard to review the issues found during the pre-start check.</p>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated alert from your Machinery Management System.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Prestart review alert email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending prestart review alert email:', error);
    throw error;
  }
};

// Send service reminder alert email
export const sendServiceReminderAlert = async (userEmail, userName, machineId, machineName, currentHours, nextServiceHours, hoursRemaining) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'alerts@machinery-app.com',
      to: userEmail,
      subject: '🔧 Upcoming Machine Service Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f39c12;">🔧 Service Reminder</h2>
          
          <p>Hello ${userName},</p>
          
          <p>One of your machines is approaching its next scheduled service:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
            <strong>Machine:</strong> ${machineName} (${machineId})<br>
            <strong>Current Hours:</strong> ${currentHours}<br>
            <strong>Next Service Due:</strong> ${nextServiceHours} hours<br>
            <strong>Hours Remaining:</strong> <span style="color: #f39c12;">${hoursRemaining} hours</span>
          </div>
          
          <p>Please schedule the service to avoid any operational issues.</p>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Schedule Service
            </a>
          </p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated service reminder from your Machinery Management System.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Service reminder email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending service reminder email:', error);
    throw error;
  }
};
