// This helper function maps user session data to ensure consistent data references
export function mapUserSessionData(userData) {
  if (!userData) return userData;
  
  // Create a new object with all properties from userData
  const mappedData = { ...userData };
  
  // Always ensure the organization field exists and is mapped from company
  // The database uses 'company' as the primary field
  if (userData.company) {
    // If company exists, always set organization to match company
    mappedData.organization = userData.company;
  } else if (userData.organization) {
    // If only organization exists, also set company for consistency with DB
    mappedData.company = userData.organization;
  } else {
    // If neither exists, set default values to avoid undefined
    mappedData.company = 'Default';
    mappedData.organization = 'Default';
  }
  
  return mappedData;
}

// Function to get consistent organization name from user data
export function getOrganizationName(userData) {
  if (!userData) return 'Default';
  
  // Always prioritize company field since that's what the database uses
  return userData.company || userData.organization || 'Default';
}
