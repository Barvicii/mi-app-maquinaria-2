/**
 * Email Service — Organization suspension/reactivation notifications
 * Uses the centralized SendGrid email sender from @/lib/email
 */
import { sendEmail } from '@/lib/email';

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
            Please contact your system administrator or support team for more information.
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

// Send suspension notification emails via SendGrid
export const sendSuspensionNotification = async (users, organizationName, adminName, isSuspended) => {
  try {
    const template = isSuspended 
      ? emailTemplates.organizationSuspended(organizationName, adminName)
      : emailTemplates.organizationUnsuspended(organizationName, adminName);

    const emailPromises = users.map(user => {
      if (!user.email) return Promise.resolve();
      return sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html
      });
    });

    await Promise.allSettled(emailPromises);
    return { success: true, emailsSent: users.length };
  } catch (error) {
    console.error('Error sending suspension notification emails:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification via SendGrid
export const sendAdminNotification = async (adminEmail, organizationName, usersAffected, isSuspended) => {
  try {
    const action = isSuspended ? 'suspended' : 'reactivated';
    await sendEmail({
      to: adminEmail,
      subject: `Organization ${action.charAt(0).toUpperCase() + action.slice(1)} - ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #374151;">Admin Notification</h2>
          <p>Organization <strong>${organizationName}</strong> has been successfully ${action}.</p>
          <p><strong>Users affected:</strong> ${usersAffected}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
};
