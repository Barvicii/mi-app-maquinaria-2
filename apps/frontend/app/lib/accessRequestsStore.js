// Simulamos una base de datos de solicitudes de acceso
// En producción, esto debería usar una base de datos real
let accessRequests = [];

export function getAllRequests() {
  return accessRequests;
}

export function addRequest(requestData) {
  const newRequest = {
    id: Date.now().toString(),
    ...requestData,
    status: 'pending',
    requestDate: new Date().toISOString(),
  };
  
  accessRequests.push(newRequest);
  return newRequest;
}

export function findRequestById(id) {
  return accessRequests.find(req => req.id === id);
}

export function findRequestByEmail(email) {
  return accessRequests.find(req => req.email === email);
}

export function updateRequestStatus(requestId, newStatus, additionalData = {}) {
  const requestIndex = accessRequests.findIndex(req => req.id === requestId);
  if (requestIndex !== -1) {
    accessRequests[requestIndex] = {
      ...accessRequests[requestIndex],
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...additionalData
    };
    return accessRequests[requestIndex];
  }
  return null;
}

export function getRequestsByStatus(status) {
  return accessRequests.filter(req => req.status === status);
}
