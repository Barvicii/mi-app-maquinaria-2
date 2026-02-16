// Utility functions for chemical filter management

/**
 * Calculate remaining hours for chemical filters
 * @param {Object} filter - Filter object with installation data
 * @param {number} currentMachineHours - Current machine hours
 * @param {number} expectedLifeHours - Expected filter life in hours
 * @returns {Object} - Object with remaining hours and status
 */
export function calculateFilterRemainingHours(filter, currentMachineHours, expectedLifeHours = 100) {
  if (!filter || !filter.installationHours || !currentMachineHours) {
    return {
      remainingHours: null,
      status: 'unknown',
      message: 'Insufficient data to calculate remaining hours'
    };
  }

  const usedHours = currentMachineHours - filter.installationHours;
  const remainingHours = expectedLifeHours - usedHours;

  let status = 'good';
  let message = `${remainingHours} hours remaining`;

  if (remainingHours <= 0) {
    status = 'overdue';
    message = `Filter overdue by ${Math.abs(remainingHours)} hours`;
  } else if (remainingHours <= 40) {
    status = 'warning';
    message = `${remainingHours} hours remaining - Plan replacement`;
  }

  return {
    remainingHours,
    usedHours,
    status,
    message,
    percentageUsed: Math.round((usedHours / expectedLifeHours) * 100)
  };
}

/**
 * Get active chemical filters for a machine
 * @param {Object} machine - Machine object
 * @returns {Array} - Array of active filters
 */
export function getActiveChemicalFilters(machine) {
  if (!machine?.chemicalFilters?.currentFilters) {
    return [];
  }

  return machine.chemicalFilters.currentFilters.filter(filter => filter.isActive);
}

/**
 * Get filter status color for UI
 * @param {string} status - Filter status
 * @returns {string} - CSS color class
 */
export function getFilterStatusColor(status) {
  switch (status) {
    case 'good':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-orange-600';
    case 'overdue':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get filter status background color for UI
 * @param {string} status - Filter status
 * @returns {string} - CSS background color class
 */
export function getFilterStatusBgColor(status) {
  switch (status) {
    case 'good':
      return 'bg-green-100';
    case 'warning':
      return 'bg-yellow-100';
    case 'critical':
      return 'bg-orange-100';
    case 'overdue':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

/**
 * Check if machine needs filter replacement alerts
 * @param {Object} machine - Machine object
 * @param {number} currentHours - Current machine hours
 * @returns {Array} - Array of alerts
 */
export function checkFilterAlerts(machine, currentHours) {
  const alerts = [];
  
  if (!machine?.chemicalFilters?.hasFilters) {
    return alerts;
  }

  const activeFilters = getActiveChemicalFilters(machine);
  const expectedLife = machine.chemicalFilters.expectedLifeHours || 100;

  activeFilters.forEach(filter => {
    const filterStatus = calculateFilterRemainingHours(filter, currentHours, expectedLife);
    
    if (filterStatus.status === 'warning' || filterStatus.status === 'overdue') {
      alerts.push({
        type: 'filter_replacement',
        filterType: filter.type,
        status: filterStatus.status,
        message: filterStatus.message,
        remainingHours: filterStatus.remainingHours,
        urgency: filterStatus.status === 'overdue' ? 'high' : 'medium'
      });
    }
  });

  return alerts;
}
