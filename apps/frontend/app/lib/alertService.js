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
    console.log('==== [AlertService] STARTING checkPrestartStatus ====');
    console.log('[AlertService] Checking prestart status for alerts');
    console.log('[AlertService] Full prestart data received:', JSON.stringify(prestartData, null, 2));
    console.log('[AlertService] Prestart data summary:', {
      _id: prestartData._id,
      maquinaId: prestartData.maquinaId,
      userId: prestartData.userId,
      estado: prestartData.estado,
      hasCheckValues: !!prestartData.checkValues,
      horasMaquina: prestartData.horasMaquina,
      horasProximoService: prestartData.horasProximoService,
      source: prestartData.source
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
    
    // Check for carbon filter alerts
    if (machine && user && prestartData.horasMaquina) {
      console.log('[AlertService] Checking carbon filter alerts...');
      console.log('[AlertService] Machine data:', {
        machineId: machine._id,
        hasFilters: !!machine.filters,
        carbonFilter: machine.filters?.carbon,
        isActive: machine.filters?.carbon?.isActive
      });
      
      const currentHours = parseInt(prestartData.horasMaquina);
      
      if (machine.filters?.carbon?.isActive && typeof machine.filters.carbon === 'object') {
        const carbonFilter = machine.filters.carbon;
        console.log('[AlertService] Found carbon filter configuration:', carbonFilter);
        
        const installationHours = carbonFilter.installationHours || 0;
        const expectedLifeHours = carbonFilter.expectedLifeHours || 100;
        const hoursUsed = currentHours - installationHours;
        const remainingHours = expectedLifeHours - hoursUsed;
        
        console.log(`[AlertService] Carbon filter calculation: current=${currentHours}, installation=${installationHours}, expected=${expectedLifeHours}, used=${hoursUsed}, remaining=${remainingHours}`);
        
        if (remainingHours <= 0) {
          console.log('[AlertService] Creating CRITICAL carbon filter alert - filter is overdue');
          try {
            const alertId = await createCarbonFilterAlert(machine, user, remainingHours, 'critical');
            console.log('[AlertService] Critical carbon filter alert created with ID:', alertId);
          } catch (error) {
            console.error('[AlertService] Error creating critical carbon filter alert:', error);
          }
        } else if (remainingHours <= 40) {
          console.log('[AlertService] Creating WARNING carbon filter alert - filter expiring soon');
          try {
            const alertId = await createCarbonFilterAlert(machine, user, remainingHours, 'warning');
            console.log('[AlertService] Warning carbon filter alert created with ID:', alertId);
          } catch (error) {
            console.error('[AlertService] Error creating warning carbon filter alert:', error);
          }
        } else {
          console.log('[AlertService] Carbon filter OK - no alert needed, remaining hours:', remainingHours);
        }
      } else {
        console.log('[AlertService] No active carbon filter configuration found');
        console.log('[AlertService] Filter details:', {
          hasFilters: !!machine.filters,
          hasCarbonFilter: !!machine.filters?.carbon,
          carbonIsActive: machine.filters?.carbon?.isActive,
          carbonType: typeof machine.filters?.carbon
        });
      }
    } else {
      console.log('[AlertService] Cannot check carbon filters - missing data:', {
        machine: !!machine,
        user: !!user,
        horasMaquina: prestartData.horasMaquina,
        userId: prestartData.userId,
        maquinaId: prestartData.maquinaId
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
    
    // Check chemical filters if machine has them and current hours are provided
    if (machine && user && prestartData.horasMaquina && machine.chemicalFilters?.hasFilters) {
      console.log('[AlertService] Checking chemical filters for alerts...');
      const currentHours = parseInt(prestartData.horasMaquina);
      const expectedLife = machine.chemicalFilters.expectedLifeHours || 100;
      
      if (machine.chemicalFilters.currentFilters && machine.chemicalFilters.currentFilters.length > 0) {
        for (const filter of machine.chemicalFilters.currentFilters) {
          if (!filter.isActive) continue;
          
          const usedHours = currentHours - (filter.installationHours || 0);
          const remainingHours = expectedLife - usedHours;
          
          // Create alert if filter needs replacement soon (10 hours or less)
          if (remainingHours <= 10 && remainingHours >= -20) { // Don't spam for very old filters
            console.log(`[AlertService] Chemical filter needs attention: ${filter.type} filter has ${remainingHours} hours remaining`);
            try {
              const filterAlertId = await createChemicalFilterAlert(machine, user, filter, currentHours);
              if (filterAlertId) {
                console.log('[AlertService] Chemical filter alert created with ID:', filterAlertId);
              }
            } catch (error) {
              console.error('[AlertService] Error creating chemical filter alert:', error);
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[AlertService] Error checking prestart status:', error);
    throw error;
  }
};

// Chemical filter alert functions
export const createChemicalFilterAlert = async (machineData, userData, filterData, currentHours) => {
  try {
    console.log('[AlertService] Creating chemical filter alert for machine:', machineData.machineId);
    
    const db = await connectDB();
    
    // Check for existing alert in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: new ObjectId(userData._id),
      type: 'chemical_filter_replacement',
      'data.machineId': machineData._id.toString(),
      'data.filterType': filterData.type,
      createdAt: { $gte: yesterday }
    });

    if (existingAlert) {
      console.log('[AlertService] Chemical filter alert already exists for this machine and filter type');
      return null;
    }

    const usedHours = currentHours - filterData.installationHours;
    const expectedLife = machineData.chemicalFilters?.expectedLifeHours || 100;
    const remainingHours = expectedLife - usedHours;
    
    const alertData = {
      userId: new ObjectId(userData._id),
      type: 'chemical_filter_replacement',
      title: 'Chemical Filter Replacement Required',
      message: `${filterData.type.charAt(0).toUpperCase() + filterData.type.slice(1)} filter for ${machineData.machineId} needs replacement`,
      priority: remainingHours <= 0 ? 'high' : remainingHours <= 5 ? 'medium' : 'low',
      read: false,
      data: {
        machineId: machineData._id.toString(),
        machineName: machineData.machineId,
        filterType: filterData.type,
        currentHours: currentHours,
        installationHours: filterData.installationHours,
        usedHours: usedHours,
        remainingHours: remainingHours,
        expectedLife: expectedLife,
        brand: filterData.brand,
        partNumber: filterData.partNumber
      },
      createdAt: new Date()
    };

    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] Chemical filter alert created with ID:', result.insertedId);

    // Send email notification
    try {
      await sendChemicalFilterEmail(
        userData.email,
        userData.name,
        machineData.machineId,
        filterData.type,
        remainingHours,
        usedHours,
        expectedLife
      );
    } catch (emailError) {
      console.error('[AlertService] Error sending chemical filter email:', emailError);
    }

    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating chemical filter alert:', error);
    throw error;
  }
};

// Function to check all machines for chemical filter alerts
export const checkChemicalFilterReminders = async () => {
  try {
    console.log('[AlertService] Checking chemical filter reminders');
    
    const db = await connectDB();
    
    // Get all machines with chemical filters
    const machines = await db.collection('machines').find({
      'chemicalFilters.hasFilters': true,
      'chemicalFilters.currentFilters.0': { $exists: true }
    }).toArray();

    console.log(`[AlertService] Found ${machines.length} machines with chemical filters`);
    
    const alertsCreated = [];
    
    for (const machine of machines) {
      const currentHours = parseInt(machine.currentHours) || 0;
      const expectedLife = machine.chemicalFilters?.expectedLifeHours || 100;
      
      if (!machine.chemicalFilters?.currentFilters) continue;
      
      for (const filter of machine.chemicalFilters.currentFilters) {
        if (!filter.isActive) continue;
        
        const usedHours = currentHours - (filter.installationHours || 0);
        const remainingHours = expectedLife - usedHours;
        
        // Create alert if filter needs replacement soon (40 hours or less)
        if (remainingHours <= 40 && remainingHours >= -50) { // Don't spam for very old filters
          console.log(`[AlertService] Machine ${machine.machineId} ${filter.type} filter needs attention: ${remainingHours} hours remaining`);
          
          // Get machine owner
          let user = null;
          
          if (machine.credentialId) {
            user = await db.collection('users').findOne({ credentialId: machine.credentialId });
          }
          
          if (!user && machine.userId) {
            user = await db.collection('users').findOne({ _id: new ObjectId(machine.userId) });
          }
          
          if (user) {
            const alertId = await createChemicalFilterAlert(machine, user, filter, currentHours);
            if (alertId) {
              alertsCreated.push(alertId);
            }
          }
        }
      }
    }
    
    console.log(`[AlertService] Created ${alertsCreated.length} chemical filter alerts`);
    return alertsCreated;
  } catch (error) {
    console.error('[AlertService] Error checking chemical filter reminders:', error);
    throw error;
  }
};

// Email function for chemical filter alerts
const sendChemicalFilterEmail = async (userEmail, userName, machineId, filterType, remainingHours, usedHours, expectedLife) => {
  try {
    const subject = `Chemical Filter Replacement Required - ${machineId}`;
    const urgencyColor = remainingHours <= 0 ? '#dc3545' : remainingHours <= 5 ? '#fd7e14' : '#ffc107';
    const urgencyText = remainingHours <= 0 ? 'OVERDUE' : remainingHours <= 5 ? 'URGENT' : 'SOON';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔬 Chemical Filter Replacement</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2 style="color: #333;">Filter Replacement ${urgencyText}</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Machine:</strong> ${machineId}</p>
            <p><strong>Filter Type:</strong> ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}</p>
            <p><strong>Hours Used:</strong> ${usedHours} / ${expectedLife}</p>
            <p><strong>Hours Remaining:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${remainingHours}</span></p>
          </div>
          
          <p style="color: #333;">
            ${remainingHours <= 0 
              ? 'This filter is overdue for replacement and should be changed immediately.'
              : `This filter needs to be replaced in ${remainingHours} hours or less.`
            }
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>Chemical Filter Monitoring System</p>
        </div>
      </div>
    `;

    const textContent = `
      CHEMICAL FILTER REPLACEMENT ${urgencyText}
      
      Machine: ${machineId}
      Filter Type: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}
      Hours Used: ${usedHours} / ${expectedLife}
      Hours Remaining: ${remainingHours}
      
      ${remainingHours <= 0 
        ? 'This filter is overdue for replacement and should be changed immediately.'
        : `This filter needs to be replaced in ${remainingHours} hours or less.`
      }
      
      Please log into your dashboard to schedule the replacement.
    `;

    await sendEmail(userEmail, subject, htmlContent, textContent);
    console.log(`[AlertService] Chemical filter email sent to ${userEmail}`);
  } catch (error) {
    console.error('[AlertService] Error sending chemical filter email:', error);
    throw error;
  }
};

// Create a carbon filter alert
export const createCarbonFilterAlert = async (machineData, userData, remainingHours, severity) => {
  try {
    console.log('[AlertService] Creating carbon filter alert');
    
    const db = await connectDB();
    
    // Get user ID in correct format
    const userId = userData._id?.toString() || userData.id;
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userId
    });
    
    // Check if chemical filter alerts are enabled for this user
    if (emailSettings && emailSettings.enableChemicalFilterAlerts === false) {
      console.log('[AlertService] Chemical filter alerts disabled for user:', userId);
      return null;
    }
    
    // Determine alert message based on severity
    let title, message;
    if (severity === 'critical') {
      title = 'Carbon Filter Replacement Required - URGENT';
      message = `Carbon filter for ${machineData.customId || machineData.machineId || 'Machine'} is overdue by ${Math.abs(remainingHours)} hours. Replace immediately before operation.`;
    } else {
      title = 'Carbon Filter Replacement Reminder';
      message = `Carbon filter for ${machineData.customId || machineData.machineId || 'Machine'} expires in ${remainingHours} hours. Plan replacement soon.`;
    }
    
    // Create alert in database
    const alertData = {
      userId: userId,
      credentialId: userData.credentialId || machineData.credentialId,
      type: 'carbon_filter',
      severity: severity,
      title: title,
      message: message,
      machineId: machineData._id?.toString(),
      machineName: machineData.customId || machineData.machineId || 'Unknown Machine',
      status: 'active',
      metadata: {
        filterType: 'carbon',
        remainingHours: remainingHours,
        carbonFilter: machineData.filters?.carbon
      },
      createdAt: new Date(),
      read: false
    };
    
    // Check if similar alert already exists (avoid duplicates)
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: alertData.userId,
      type: 'carbon_filter',
      machineId: alertData.machineId,
      status: 'active'
    });
    
    let alertId;
    let shouldSendEmail = true;
    
    if (existingAlert) {
      console.log('[AlertService] Carbon filter alert already exists, updating instead');
      
      // Check if we sent an email in the last 24 hours to avoid spam
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (existingAlert.lastEmailSent && existingAlert.lastEmailSent > twentyFourHoursAgo) {
        console.log('[AlertService] Email sent recently, skipping email to avoid spam');
        shouldSendEmail = false;
      }
      
      await db.collection('userAlerts').updateOne(
        { _id: existingAlert._id },
        { 
          $set: { 
            severity: alertData.severity,
            title: alertData.title,
            message: alertData.message,
            metadata: alertData.metadata,
            updatedAt: new Date(),
            ...(shouldSendEmail && { lastEmailSent: new Date() })
          } 
        }
      );
      alertId = existingAlert._id;
    } else {
      // Insert new alert
      alertData.lastEmailSent = new Date();
      const result = await db.collection('userAlerts').insertOne(alertData);
      alertId = result.insertedId;
      console.log('[AlertService] Carbon filter alert created:', alertId);
    }
    
    // Send email notification (if not sent recently)
    if (shouldSendEmail) {
      try {
        console.log('[AlertService] Attempting to send carbon filter email...');
        await sendCarbonFilterEmail(userData, machineData, remainingHours, severity);
        console.log('[AlertService] Carbon filter email sent successfully');
      } catch (emailError) {
        console.error('[AlertService] Failed to send carbon filter email:', emailError);
        // Continue even if email fails
      }
    }
    
    return alertId;
  } catch (error) {
    console.error('[AlertService] Error creating carbon filter alert:', error);
    throw error;
  }
};

// Send carbon filter email notification
const sendCarbonFilterEmail = async (userData, machineData, remainingHours, severity) => {
  try {
    // Get email addresses from user settings or fallback to user email
    const db = await connectDB();
    const userId = userData._id?.toString() || userData.id;
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userId
    });
    
    const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
    
    const machineName = machineData.customId || machineData.machineId || 'Unknown Machine';
    let subject, htmlContent, textContent;
    
    if (severity === 'critical') {
      subject = `🚨 URGENT: Carbon Filter Replacement Required - ${machineName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0;">🚨 URGENT ALERT</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
              Carbon Filter Replacement Required
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Machine:</strong> ${machineName}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">Carbon filter is overdue by ${Math.abs(remainingHours)} hours</span></p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-NZ')}</p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24;">
                <strong>⚠️ SAFETY CRITICAL:</strong> Replace carbon filter immediately before operating this machine. Do not use chemical equipment without a functioning carbon filter.
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
      textContent = `URGENT: Carbon filter replacement required for ${machineName}. Filter is overdue by ${Math.abs(remainingHours)} hours. Replace immediately before operation.`;
    } else {
      subject = `⚠️ Carbon Filter Replacement Reminder - ${machineName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffc107; margin: 0;">⚠️ Maintenance Alert</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
              Carbon Filter Replacement Reminder
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Machine:</strong> ${machineName}</p>
              <p><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">Carbon filter expires in ${remainingHours} hours</span></p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-NZ')}</p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Action Required:</strong> Plan carbon filter replacement soon. Order replacement filter and schedule maintenance.
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
      textContent = `Carbon filter replacement reminder for ${machineName}. Filter expires in ${remainingHours} hours. Plan replacement soon.`;
    }

    for (const email of emailAddresses) {
      if (email) {
        console.log('✓ Sending carbon filter alert email to:', email);
        await sendEmail({
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[AlertService] Carbon filter email sent to ${email}`);
      }
    }
  } catch (error) {
    console.error('[AlertService] Error sending carbon filter email:', error);
    throw error;
  }
};

// Check for vehicles with expiring RUC or REGO
export const checkVehicleExpirations = async () => {
  try {
    console.log('[AlertService] Checking for vehicles with expiring RUC/REGO');
    
    const db = await connectDB();
    
    // Get all vehicles with RUC or REGO data
    const vehicles = await db.collection('vehicles').find({
      equipmentType: 'vehicle'
    }).toArray();
    
    const alertsCreated = [];
    
    for (const vehicle of vehicles) {
      // Get vehicle owner
      let user = null;
      
      // Try by credentialId first (new way)
      if (vehicle.credentialId) {
        user = await db.collection('users').findOne({ 
          credentialId: vehicle.credentialId 
        });
      }
      
      // Fallback to userId (old way)
      if (!user && vehicle.userId) {
        user = await db.collection('users').findOne({ 
          _id: new ObjectId(vehicle.userId) 
        });
      }
      
      if (!user) {
        console.warn('[AlertService] No user found for vehicle:', vehicle._id);
        continue;
      }
      
      // Check RUC expiration
      if (vehicle.ruc?.isActive && vehicle.ruc?.nextDueKm && vehicle.kilometerMileage) {
        const currentKm = parseInt(vehicle.kilometerMileage) || 0;
        const nextDueKm = parseInt(vehicle.ruc.nextDueKm) || 0;
        const remainingKm = nextDueKm - currentKm;
        
        // Create alert if RUC is due within 1000km or expired
        if (remainingKm <= 1000) {
          console.log(`[AlertService] Vehicle ${vehicle.name || vehicle._id} RUC due in ${remainingKm} km`);
          
          try {
            const alertId = await createRUCExpirationAlert(vehicle, user, remainingKm);
            if (alertId) {
              alertsCreated.push(alertId);
              console.log(`[AlertService] RUC alert created for vehicle ${vehicle.name || vehicle._id}`);
            }
          } catch (error) {
            console.error('[AlertService] Error creating RUC alert for vehicle:', vehicle._id, error);
          }
        }
      }
      
      // Check REGO expiration
      if (vehicle.rego?.isActive && vehicle.rego?.expiryDate) {
        const expiryDate = new Date(vehicle.rego.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Create alert if REGO expires within 30 days or is expired
        if (daysUntilExpiry <= 30) {
          console.log(`[AlertService] Vehicle ${vehicle.name || vehicle._id} REGO expires in ${daysUntilExpiry} days`);
          
          try {
            const alertId = await createREGOExpirationAlert(vehicle, user, daysUntilExpiry);
            if (alertId) {
              alertsCreated.push(alertId);
              console.log(`[AlertService] REGO alert created for vehicle ${vehicle.name || vehicle._id}`);
            }
          } catch (error) {
            console.error('[AlertService] Error creating REGO alert for vehicle:', vehicle._id, error);
          }
        }
      }
    }
    
    console.log(`[AlertService] Created ${alertsCreated.length} vehicle expiration alerts`);
    return alertsCreated;
  } catch (error) {
    console.error('[AlertService] Error checking vehicle expirations:', error);
    throw error;
  }
};

// Check for vehicles that need service soon
export const checkVehicleServiceReminders = async () => {
  try {
    console.log('[AlertService] Checking for vehicles that need service soon');
    
    const db = await connectDB();
    
    // Get all vehicles with service data
    const vehicles = await db.collection('vehicles').find({
      equipmentType: 'vehicle',
      kilometerMileage: { $exists: true, $ne: null },
      nextService: { $exists: true, $ne: null }
    }).toArray();
    
    const alertsCreated = [];
    
    for (const vehicle of vehicles) {
      const currentKm = parseInt(vehicle.kilometerMileage) || 0;
      const nextServiceKm = parseInt(vehicle.nextService) || 0;
      const kmRemaining = nextServiceKm - currentKm;
      
      // Check if vehicle needs service in 1000km or less
      if (kmRemaining <= 1000 && kmRemaining > 0) {
        console.log(`[AlertService] Vehicle ${vehicle.name || vehicle._id} needs service in ${kmRemaining} km`);
        
        // Get vehicle owner
        let user = null;
        
        // Try by credentialId first (new way)
        if (vehicle.credentialId) {
          user = await db.collection('users').findOne({ 
            credentialId: vehicle.credentialId 
          });
        }
        
        // Fallback to userId (old way)
        if (!user && vehicle.userId) {
          user = await db.collection('users').findOne({ 
            _id: new ObjectId(vehicle.userId) 
          });
        }
        
        if (user) {
          try {
            const alertId = await createVehicleServiceReminderAlert(vehicle, user, currentKm, nextServiceKm);
            if (alertId) {
              alertsCreated.push(alertId);
              console.log(`[AlertService] Vehicle service alert created for ${vehicle.name || vehicle._id}`);
            }
          } catch (error) {
            console.error('[AlertService] Error creating vehicle service reminder:', vehicle._id, error);
          }
        } else {
          console.warn('[AlertService] No user found for vehicle:', vehicle._id);
        }
      }
    }
    
    console.log(`[AlertService] Created ${alertsCreated.length} vehicle service reminder alerts`);
    return alertsCreated;
  } catch (error) {
    console.error('[AlertService] Error checking vehicle service reminders:', error);
    throw error;
  }
};

// Create RUC expiration alert
export const createRUCExpirationAlert = async (vehicleData, userData, remainingKm) => {
  try {
    console.log('[AlertService] Creating RUC expiration alert');
    
    const db = await connectDB();
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userData.id || userData._id?.toString() 
    });
    
    // Check if service alerts are enabled for this user (using service alerts setting for vehicles)
    if (emailSettings && emailSettings.enableServiceAlerts === false) {
      console.log('[AlertService] Vehicle alerts disabled for user:', userData.id);
      return null;
    }
    
    // Check if alert already exists for this vehicle (within last 7 days)
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: userData.id || userData._id?.toString(),
      type: 'ruc_expiration',
      machineId: vehicleData._id.toString(),
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    if (existingAlert) {
      console.log('[AlertService] RUC expiration alert already exists for this vehicle');
      return existingAlert._id;
    }
    
    const severity = remainingKm <= 0 ? 'critical' : remainingKm <= 500 ? 'high' : 'medium';
    const isExpired = remainingKm <= 0;
    
    // Create alert in database
    const alertData = {
      userId: userData.id || userData._id?.toString(),
      credentialId: userData.credentialId || vehicleData.credentialId,
      type: 'ruc_expiration',
      severity: severity,
      title: isExpired ? 'RUC Expired - Action Required' : 'RUC Renewal Required Soon',
      message: isExpired 
        ? `Vehicle ${vehicleData.name || vehicleData.machineId || 'Vehicle'} RUC has expired. Vehicle is overdue by ${Math.abs(remainingKm)} km`
        : `Vehicle ${vehicleData.name || vehicleData.machineId || 'Vehicle'} RUC expires in ${remainingKm} km. Renewal required soon`,
      machineId: vehicleData._id.toString(),
      machineName: vehicleData.name || vehicleData.machineId || 'Unknown Vehicle',
      status: 'active',
      metadata: {
        currentKm: vehicleData.kilometerMileage,
        nextDueKm: vehicleData.ruc?.nextDueKm,
        remainingKm: remainingKm,
        isExpired: isExpired
      },
      createdAt: new Date(),
      read: false
    };
    
    // Insert alert
    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] RUC expiration alert created:', result.insertedId);
    
    // Send email notification
    try {
      await sendRUCExpirationEmail(userData, vehicleData, remainingKm, severity, emailSettings);
    } catch (emailError) {
      console.error('[AlertService] Error sending RUC expiration email:', emailError);
      // Don't fail the alert creation if email fails
    }
    
    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating RUC expiration alert:', error);
    throw error;
  }
};

// Create REGO expiration alert
export const createREGOExpirationAlert = async (vehicleData, userData, daysUntilExpiry) => {
  try {
    console.log('[AlertService] Creating REGO expiration alert');
    
    const db = await connectDB();
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userData.id || userData._id?.toString() 
    });
    
    // Check if service alerts are enabled for this user (using service alerts setting for vehicles)
    if (emailSettings && emailSettings.enableServiceAlerts === false) {
      console.log('[AlertService] Vehicle alerts disabled for user:', userData.id);
      return null;
    }
    
    // Check if alert already exists for this vehicle (within last 7 days)
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: userData.id || userData._id?.toString(),
      type: 'rego_expiration',
      machineId: vehicleData._id.toString(),
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    if (existingAlert) {
      console.log('[AlertService] REGO expiration alert already exists for this vehicle');
      return existingAlert._id;
    }
    
    const severity = daysUntilExpiry <= 0 ? 'critical' : daysUntilExpiry <= 7 ? 'high' : 'medium';
    const isExpired = daysUntilExpiry <= 0;
    
    // Create alert in database
    const alertData = {
      userId: userData.id || userData._id?.toString(),
      credentialId: userData.credentialId || vehicleData.credentialId,
      type: 'rego_expiration',
      severity: severity,
      title: isExpired ? 'REGO Expired - Action Required' : 'REGO Renewal Required Soon',
      message: isExpired 
        ? `Vehicle ${vehicleData.name || vehicleData.machineId || 'Vehicle'} REGO has expired. Expired ${Math.abs(daysUntilExpiry)} days ago`
        : `Vehicle ${vehicleData.name || vehicleData.machineId || 'Vehicle'} REGO expires in ${daysUntilExpiry} days. Renewal required soon`,
      machineId: vehicleData._id.toString(),
      machineName: vehicleData.name || vehicleData.machineId || 'Unknown Vehicle',
      status: 'active',
      metadata: {
        expiryDate: vehicleData.rego?.expiryDate,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: isExpired
      },
      createdAt: new Date(),
      read: false
    };
    
    // Insert alert
    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] REGO expiration alert created:', result.insertedId);
    
    // Send email notification
    try {
      await sendREGOExpirationEmail(userData, vehicleData, daysUntilExpiry, severity, emailSettings);
    } catch (emailError) {
      console.error('[AlertService] Error sending REGO expiration email:', emailError);
      // Don't fail the alert creation if email fails
    }
    
    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating REGO expiration alert:', error);
    throw error;
  }
};

// Create vehicle service reminder alert
export const createVehicleServiceReminderAlert = async (vehicleData, userData, currentKm, nextServiceKm) => {
  try {
    console.log('[AlertService] Creating vehicle service reminder alert');
    
    const db = await connectDB();
    const kmRemaining = nextServiceKm - currentKm;
    
    // Get user's email settings
    const emailSettings = await db.collection('userAlertSettings').findOne({ 
      userId: userData.id || userData._id?.toString() 
    });
    
    // Check if service alerts are enabled for this user
    if (emailSettings && emailSettings.enableServiceAlerts === false) {
      console.log('[AlertService] Vehicle service alerts disabled for user:', userData.id);
      return null;
    }
    
    // Check if alert already exists for this vehicle (within last 7 days)
    const existingAlert = await db.collection('userAlerts').findOne({
      userId: userData.id || userData._id?.toString(),
      type: 'vehicle_service_reminder',
      machineId: vehicleData._id.toString(),
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    if (existingAlert) {
      console.log('[AlertService] Vehicle service reminder alert already exists for this vehicle');
      return existingAlert._id;
    }
    
    // Create alert in database
    const alertData = {
      userId: userData.id || userData._id?.toString(),
      credentialId: userData.credentialId || vehicleData.credentialId,
      type: 'vehicle_service_reminder',
      severity: kmRemaining <= 500 ? 'high' : 'medium',
      title: 'Vehicle Service Required Soon',
      message: `Vehicle ${vehicleData.name || vehicleData.machineId || 'Vehicle'} is approaching its next scheduled service (${kmRemaining} km remaining)`,
      machineId: vehicleData._id.toString(),
      machineName: vehicleData.name || vehicleData.machineId || 'Unknown Vehicle',
      status: 'active',
      metadata: {
        currentKm: currentKm,
        nextServiceKm: nextServiceKm,
        kmRemaining: kmRemaining
      },
      createdAt: new Date(),
      read: false
    };
    
    // Insert alert
    const result = await db.collection('userAlerts').insertOne(alertData);
    console.log('[AlertService] Vehicle service reminder alert created:', result.insertedId);
    
    // Send email notification
    try {
      await sendVehicleServiceReminderEmail(userData, vehicleData, currentKm, nextServiceKm, kmRemaining, emailSettings);
    } catch (emailError) {
      console.error('[AlertService] Error sending vehicle service reminder email:', emailError);
      // Don't fail the alert creation if email fails
    }
    
    return result.insertedId;
  } catch (error) {
    console.error('[AlertService] Error creating vehicle service reminder alert:', error);
    throw error;
  }
};

// Send RUC expiration email notification
const sendRUCExpirationEmail = async (userData, vehicleData, remainingKm, severity, emailSettings) => {
  try {
    const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
    const vehicleName = vehicleData.name || vehicleData.machineId || 'Unknown Vehicle';
    const isExpired = remainingKm <= 0;
    
    let subject, htmlContent, textContent;
    
    if (severity === 'critical') {
      subject = `🚨 URGENT: RUC Expired - ${vehicleName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0;">🚨 RUC EXPIRED</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
              Vehicle RUC Has Expired
            </h2>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vehicle:</strong> ${vehicleName}</p>
              <p><strong>Current Kilometers:</strong> ${vehicleData.kilometerMileage || 'N/A'} km</p>
              <p><strong>RUC Due At:</strong> ${vehicleData.ruc?.nextDueKm || 'N/A'} km</p>
              <p><strong>Overdue By:</strong> ${Math.abs(remainingKm)} km</p>
            </div>
            
            <div style="background-color: #721c24; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">
                ⚠️ CRITICAL: Vehicle should not be operated until RUC is renewed!
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
    } else {
      subject = `⚠️ RUC Renewal Required Soon - ${vehicleName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffc107; margin: 0;">⚠️ RUC Renewal Due</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
              Vehicle RUC Renewal Required Soon
            </h2>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vehicle:</strong> ${vehicleName}</p>
              <p><strong>Current Kilometers:</strong> ${vehicleData.kilometerMileage || 'N/A'} km</p>
              <p><strong>RUC Due At:</strong> ${vehicleData.ruc?.nextDueKm || 'N/A'} km</p>
              <p><strong>Remaining:</strong> ${remainingKm} km</p>
            </div>
            
            <div style="background-color: #856404; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Action Required:</strong> Plan RUC renewal soon to avoid operational interruption.
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
    }
    
    textContent = `RUC ${isExpired ? 'EXPIRED' : 'RENEWAL DUE'} - ${vehicleName}
    
Vehicle: ${vehicleName}
Current Kilometers: ${vehicleData.kilometerMileage || 'N/A'} km
RUC Due At: ${vehicleData.ruc?.nextDueKm || 'N/A'} km
${isExpired ? 'Overdue By' : 'Remaining'}: ${Math.abs(remainingKm)} km

${isExpired ? 'CRITICAL: Vehicle should not be operated until RUC is renewed!' : 'Action Required: Plan RUC renewal soon to avoid operational interruption.'}

Machinery Management System`;
    
    for (const email of emailAddresses) {
      if (email) {
        console.log('✓ Sending RUC expiration email to:', email);
        await sendEmail({
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[AlertService] RUC expiration email sent to ${email}`);
      }
    }
  } catch (error) {
    console.error('[AlertService] Error sending RUC expiration email:', error);
    throw error;
  }
};

// Send REGO expiration email notification
const sendREGOExpirationEmail = async (userData, vehicleData, daysUntilExpiry, severity, emailSettings) => {
  try {
    const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
    const vehicleName = vehicleData.name || vehicleData.machineId || 'Unknown Vehicle';
    const isExpired = daysUntilExpiry <= 0;
    
    let subject, htmlContent, textContent;
    
    if (severity === 'critical') {
      subject = `🚨 URGENT: REGO Expired - ${vehicleName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc3545; margin: 0;">🚨 REGO EXPIRED</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
              Vehicle Registration Has Expired
            </h2>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vehicle:</strong> ${vehicleName}</p>
              <p><strong>Expiry Date:</strong> ${new Date(vehicleData.rego?.expiryDate).toLocaleDateString('en-NZ')}</p>
              <p><strong>Expired:</strong> ${Math.abs(daysUntilExpiry)} days ago</p>
            </div>
            
            <div style="background-color: #721c24; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">
                ⚠️ CRITICAL: Vehicle should not be operated until REGO is renewed!
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
    } else {
      subject = `⚠️ REGO Renewal Required Soon - ${vehicleName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffc107; margin: 0;">⚠️ REGO Renewal Due</h1>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">
              Vehicle Registration Renewal Required Soon
            </h2>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vehicle:</strong> ${vehicleName}</p>
              <p><strong>Expiry Date:</strong> ${new Date(vehicleData.rego?.expiryDate).toLocaleDateString('en-NZ')}</p>
              <p><strong>Days Remaining:</strong> ${daysUntilExpiry} days</p>
            </div>
            
            <div style="background-color: #856404; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Action Required:</strong> Plan REGO renewal soon to avoid operational interruption.
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
    }
    
    textContent = `REGO ${isExpired ? 'EXPIRED' : 'RENEWAL DUE'} - ${vehicleName}
    
Vehicle: ${vehicleName}
Expiry Date: ${new Date(vehicleData.rego?.expiryDate).toLocaleDateString('en-NZ')}
${isExpired ? 'Expired' : 'Days Remaining'}: ${Math.abs(daysUntilExpiry)} days

${isExpired ? 'CRITICAL: Vehicle should not be operated until REGO is renewed!' : 'Action Required: Plan REGO renewal soon to avoid operational interruption.'}

Machinery Management System`;
    
    for (const email of emailAddresses) {
      if (email) {
        console.log('✓ Sending REGO expiration email to:', email);
        await sendEmail({
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[AlertService] REGO expiration email sent to ${email}`);
      }
    }
  } catch (error) {
    console.error('[AlertService] Error sending REGO expiration email:', error);
    throw error;
  }
};

// Send vehicle service reminder email notification
const sendVehicleServiceReminderEmail = async (userData, vehicleData, currentKm, nextServiceKm, kmRemaining, emailSettings) => {
  try {
    const emailAddresses = emailSettings?.emails?.filter(email => email) || [userData.email];
    const vehicleName = vehicleData.name || vehicleData.machineId || 'Unknown Vehicle';
    
    const subject = `🔧 Vehicle Service Required Soon - ${vehicleName}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #17a2b8; margin: 0;">🔧 Vehicle Service Due</h1>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">
            Vehicle Service Required Soon
          </h2>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Vehicle:</strong> ${vehicleName}</p>
            <p><strong>Current Kilometers:</strong> ${currentKm} km</p>
            <p><strong>Next Service Due:</strong> ${nextServiceKm} km</p>
            <p><strong>Kilometers Remaining:</strong> ${kmRemaining} km</p>
          </div>
          
          <div style="background-color: #0c5460; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>Action Required:</strong> Schedule vehicle service soon to maintain optimal performance and prevent unexpected downtime.
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
    
    const textContent = `Vehicle Service Required Soon - ${vehicleName}
    
Vehicle: ${vehicleName}
Current Kilometers: ${currentKm} km
Next Service Due: ${nextServiceKm} km
Kilometers Remaining: ${kmRemaining} km

Action Required: Schedule vehicle service soon to maintain optimal performance and prevent unexpected downtime.

Machinery Management System`;
    
    for (const email of emailAddresses) {
      if (email) {
        console.log('✓ Sending vehicle service reminder email to:', email);
        await sendEmail({
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[AlertService] Vehicle service reminder email sent to ${email}`);
      }
    }
  } catch (error) {
    console.error('[AlertService] Error sending vehicle service reminder email:', error);
    throw error;
  }
};

