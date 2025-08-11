// Alert service for creating and managing alerts
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendEmail } from '@/lib/email.js';

// Create a prestart review alert
export const createPrestartReviewAlert = async (prestartData, machineData, userData) => {
  try {
    console.log('[AlertService] Creating prestart review alert');
    
    const db = await connectDB();
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userData.id || userData._id?.toString() 
    });
    
    // Check if prestart alerts are enabled for this user
    if (emailSettings && emailSettings.enablePrestartAlerts === false) {
      console.log('[AlertService] Prestart alerts disabled for user:', userData.id);
      return null;
    }
    
    // Create alert in database
    const alertData = {
      userId: userData.id || userData._id?.toString(),
      credentialId: userData.credentialId || prestartData.credentialId,
      type: 'prestart_review',
      severity: 'high',
      title: 'Pre-Start Check Requires Review',
      message: `Pre-start check for ${machineData.customId || machineData.machineId || 'Machine'} reported issues that need attention`,
      machineId: prestartData.maquinaId,
      machineName: machineData.customId || machineData.machineId || 'Unknown Machine',
      prestartId: prestartData._id?.toString(),
      status: 'active',
      metadata: {
        prestartDate: prestartData.fecha || new Date(),
        operator: prestartData.operador,
        issues: prestartData.checkValues || {}
      },
      createdAt: new Date(),
      read: false
    };
    
    // Insert alert
    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] Prestart review alert created:', result.insertedId);
    
    // Send email notification
    try {
      // Get email addresses from user settings or fallback to user email
      const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
      
      for (const email of emailAddresses) {
        if (email) {
          console.log('✓ Sending pre-start alert email to:', email);
          
          const machineName = machineData.customId || machineData.machineId || 'Unknown Machine';
          const operatorName = prestartData.operador || 'Unknown Operator';
          
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #dc3545; margin: 0;">⚠️ Review Alert</h1>
                </div>
                
                <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
                  Pre-Start Check Requires Review
                </h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Machine:</strong> ${machineName}</p>
                  <p><strong>Operator:</strong> ${operatorName}</p>
                  <p><strong>Date:</strong> ${new Date(prestartData.fecha || new Date()).toLocaleDateString('en-NZ')}</p>
                  <p><strong>Type:</strong> Pre-Start Review</p>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>Action Required:</strong> This pre-start check needs immediate review by an administrator.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px;">
                    Machinery Management System
                  </p>
                </div>
              </div>
            </div>
          `;

          const textContent = `
            REVIEW ALERT - Pre-Start Check Requires Review
            
            Machine: ${machineName}
            Operator: ${operatorName}
            Date: ${new Date(prestartData.fecha || new Date()).toLocaleDateString('en-NZ')}
            Type: Pre-Start Review
            
            Action Required: This pre-start check needs immediate review by an administrator.
            
            Machinery Management System
          `;

          await sendEmail({
            to: email,
            subject: 'Alert: Pre-Start Check Requires Review',
            text: textContent,
            html: htmlContent
          });
          console.log('[AlertService] Prestart review email sent to:', email);
        }
      }
    } catch (emailError) {
      console.error('[AlertService] Error sending prestart review emails:', emailError);
      // Don't fail the alert creation if email fails
    }
    
    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating prestart review alert:', error);
    throw error;
  }
};

// Create a service reminder alert
export const createServiceReminderAlert = async (machineData, userData, currentHours, nextServiceHours) => {
  try {
    console.log('[AlertService] Creating service reminder alert');
    
    const db = await connectDB();
    const hoursRemaining = nextServiceHours - currentHours;
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userData.id || userData._id?.toString() 
    });
    
    // Check if service alerts are enabled for this user
    if (emailSettings && emailSettings.enableServiceAlerts === false) {
      console.log('[AlertService] Service alerts disabled for user:', userData.id);
      return null;
    }
    
    // Check if alert already exists for this machine (within last 24 hours)
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: userData.id || userData._id?.toString(),
      type: 'service_reminder',
      machineId: machineData._id.toString(),
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (existingAlert) {
      console.log('[AlertService] Service reminder alert already exists for this machine');
      return existingAlert._id;
    }
    
    // Create alert in database
    const alertData = {
      userId: userData.id || userData._id?.toString(),
      credentialId: userData.credentialId || machineData.credentialId,
      type: 'service_reminder',
      severity: hoursRemaining <= 5 ? 'high' : 'medium',
      title: 'Upcoming Service Required',
      message: `${machineData.customId || machineData.machineId || 'Machine'} is approaching its next scheduled service (${hoursRemaining} hours remaining)`,
      machineId: machineData._id.toString(),
      machineName: machineData.customId || machineData.machineId || 'Unknown Machine',
      status: 'active',
      metadata: {
        currentHours: currentHours,
        nextServiceHours: nextServiceHours,
        hoursRemaining: hoursRemaining
      },
      createdAt: new Date(),
      read: false
    };
    
    // Insert alert
    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] Service reminder alert created:', result.insertedId);
    
    // Send email notification
    try {
      // Get email addresses from user settings or fallback to user email
      const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
      
      for (const email of emailAddresses) {
        if (email) {
          console.log('✓ Sending service reminder email to:', email);
          
          const machineName = machineData.customId || machineData.machineId || 'Unknown Machine';
          
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #ffc107; margin: 0;">🔧 Service Reminder</h1>
                </div>
                
                <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
                  Upcoming Service Required
                </h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Machine:</strong> ${machineName}</p>
                  <p><strong>Current Hours:</strong> ${currentHours}</p>
                  <p><strong>Next Service At:</strong> ${nextServiceHours} hours</p>
                  <p><strong>Hours Remaining:</strong> ${hoursRemaining}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-NZ')}</p>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>Action Required:</strong> Schedule maintenance service for this machine.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px;">
                    Machinery Management System
                  </p>
                </div>
              </div>
            </div>
          `;

          const textContent = `
            SERVICE REMINDER
            
            Machine: ${machineName}
            Current Hours: ${currentHours}
            Next Service At: ${nextServiceHours} hours
            Hours Remaining: ${hoursRemaining}
            Date: ${new Date().toLocaleDateString('en-NZ')}
            
            Action Required: Schedule maintenance service for this machine.
            
            Machinery Management System
          `;

          await sendEmail({
            to: email,
            subject: 'Reminder: Machinery Service Due',
            text: textContent,
            html: htmlContent
          });
          console.log('[AlertService] Service reminder email sent to:', email);
        }
      }
    } catch (emailError) {
      console.error('[AlertService] Error sending service reminder emails:', emailError);
      // Don't fail the alert creation if email fails
    }
    
    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating service reminder alert:', error);
    throw error;
  }
};

// Check for machines that need service soon
export const checkServiceReminders = async () => {
  try {
    console.log('[AlertService] Checking for machines that need service soon');
    
    const db = await connectDB();
    
    // Get all machines with current hours and next service hours, grouped by credentialId
    const machines = await db.collection('machines').find({
      currentHours: { $exists: true, $ne: null },
      nextService: { $exists: true, $ne: null }
    }).toArray();
    
    const alertsCreated = [];
    
    for (const machine of machines) {
      const currentHours = parseInt(machine.currentHours) || 0;
      const nextServiceHours = parseInt(machine.nextService) || 0;
      const hoursRemaining = nextServiceHours - currentHours;
      
      // Check if machine needs service in 10 hours or less
      if (hoursRemaining <= 10 && hoursRemaining > 0) {
        console.log(`[AlertService] Machine ${machine.customId || machine.machineId} needs service in ${hoursRemaining} hours`);
        
        // Get machine owner - try multiple ways to find the user
        let user = null;
        
        // Try by credentialId first (new way)
        if (machine.credentialId) {
          user = await db.collection('users').findOne({ 
            credentialId: machine.credentialId 
          });
        }
        
        // Fallback to userId (old way)
        if (!user && machine.userId) {
          user = await db.collection('users').findOne({ 
            _id: new ObjectId(machine.userId) 
          });
        }
        
        if (user) {
          try {
            const alertId = await createServiceReminderAlert(machine, user, currentHours, nextServiceHours);
            if (alertId) {
              alertsCreated.push(alertId);
              console.log(`[AlertService] Service alert created for machine ${machine.customId || machine.machineId}`);
            }
          } catch (error) {
            console.error('[AlertService] Error creating service reminder for machine:', machine._id, error);
          }
        } else {
          console.warn('[AlertService] No user found for machine:', machine._id, {
            credentialId: machine.credentialId,
            userId: machine.userId
          });
        }
      }
    }
    
    console.log(`[AlertService] Created ${alertsCreated.length} service reminder alerts`);
    return alertsCreated;
  } catch (error) {
    console.error('[AlertService] Error checking service reminders:', error);
    throw error;
  }
};

// Check prestart status and create alerts if needed
export const checkPrestartStatus = async (prestartData) => {
  try {
    console.log('[AlertService] Checking prestart status for alerts');
    console.log('[AlertService] Full prestart data received:', JSON.stringify(prestartData, null, 2));
    console.log('[AlertService] Prestart data:', {
      _id: prestartData._id,
      maquinaId: prestartData.maquinaId,
      estado: prestartData.estado,
      hasCheckValues: !!prestartData.checkValues,
      horasMaquina: prestartData.horasMaquina,
      horasProximoService: prestartData.horasProximoService
    });
    
    // Determine if prestart needs review
    let needsReview = false;
    let reasons = [];
    
    // Check estado field for explicit attention request
    if (prestartData.estado === 'Requiere atención' || prestartData.estado === 'needs review') {
      needsReview = true;
      reasons.push('Status marked as requiring attention');
    }
    
    // Check individual check items
    if (prestartData.checkValues) {
      const checkItems = prestartData.checkValues;
      console.log('[AlertService] Check values:', checkItems);
      
      // Get all failed checks
      const failedChecks = Object.entries(checkItems)
        .filter(([key, value]) => value === false)
        .map(([key, value]) => key);
      
      console.log('[AlertService] Failed checks:', failedChecks);
      
      // If any check failed, mark for review
      if (failedChecks.length > 0) {
        needsReview = true;
        reasons.push(`Failed checks: ${failedChecks.join(', ')}`);
        
        // Check for critical failures
        const criticalChecks = ['aceite', 'agua', 'frenos', 'nivelCombustible'];
        const failedCriticalChecks = failedChecks.filter(check => criticalChecks.includes(check));
        
        if (failedCriticalChecks.length > 0) {
          reasons.push(`Critical failures: ${failedCriticalChecks.join(', ')}`);
        }
      }
    }
    
    console.log('[AlertService] Needs review:', needsReview, 'Reasons:', reasons);
    
    // Always check for service hour alerts regardless of prestart review status
    console.log('[AlertService] Checking service hours for alerts...');
    const db = await connectDB();
    
    // Get machine data
    let machine = null;
    if (prestartData.maquinaId) {
      try {
        if (ObjectId.isValid(prestartData.maquinaId)) {
          machine = await db.collection('machines').findOne({ _id: new ObjectId(prestartData.maquinaId) });
        } else {
          machine = await db.collection('machines').findOne({ 
            $or: [
              { customId: prestartData.maquinaId },
              { maquinaId: prestartData.maquinaId },
              { code: prestartData.maquinaId }
            ]
          });
        }
      } catch (error) {
        console.error('[AlertService] Error finding machine:', error);
      }
    }
    
    console.log('[AlertService] Found machine:', !!machine);
    
    // Get user data
    let user = null;
    if (prestartData.userId && ObjectId.isValid(prestartData.userId)) {
      try {
        user = await db.collection('users').findOne({ _id: new ObjectId(prestartData.userId) });
      } catch (error) {
        console.error('[AlertService] Error finding user:', error);
      }
    }
    
    console.log('[AlertService] Found user:', !!user);
    
    // Check for service hour alerts
    if (machine && user && prestartData.horasMaquina && prestartData.horasProximoService) {
      const currentHours = parseInt(prestartData.horasMaquina);
      const nextServiceHours = parseInt(prestartData.horasProximoService);
      
      if (!isNaN(currentHours) && !isNaN(nextServiceHours)) {
        const hoursRemaining = nextServiceHours - currentHours;
        console.log(`[AlertService] Checking service hours: current=${currentHours}, next=${nextServiceHours}, remaining=${hoursRemaining}`);
        
        // Create service reminder if 10 hours or less remaining
        if (hoursRemaining <= 10 && hoursRemaining >= 0) {
          console.log('[AlertService] Creating service reminder alert based on prestart hours');
          const serviceAlertId = await createServiceReminderAlert(machine, user, currentHours, nextServiceHours);
          console.log('[AlertService] Service alert created with ID:', serviceAlertId);
        } else {
          console.log('[AlertService] Service hours OK - no alert needed');
        }
      } else {
        console.log('[AlertService] Invalid hours data - cannot check service alerts');
      }
    } else {
      console.log('[AlertService] Cannot check service hours - missing data:', {
        machine: !!machine,
        user: !!user,
        horasMaquina: prestartData.horasMaquina,
        horasProximoService: prestartData.horasProximoService
      });
    }
    
    if (needsReview) {
      console.log('[AlertService] Prestart needs review, creating alert');
      
      if (machine && user) {
        const alertId = await createPrestartReviewAlert(prestartData, machine, user);
        console.log('[AlertService] Prestart review alert created with ID:', alertId);
        return alertId;
      } else {
        console.warn('[AlertService] Could not create prestart review alert - missing machine or user data');
        console.warn('[AlertService] Machine found:', !!machine, 'User found:', !!user);
      }
    }
    
    return null;
  } catch (error) {
    console.error('[AlertService] Error checking prestart status:', error);
    throw error;
  }
};

