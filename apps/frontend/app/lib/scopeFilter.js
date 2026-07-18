/**
 * Build a MongoDB filter that scopes queries to the current user's data
 * according to their role. Consistent with the existing rules in
 * /api/machines and /api/vehicles.
 *
 * Rules:
 *   - SUPER_ADMIN → sees everything (empty filter).
 *   - ADMIN with organization → sees anything owned by that organization,
 *       plus anything they personally created.
 *   - Any user with credentialId → filter by credentialId (regular tenant).
 *   - Otherwise → filter by userId / createdBy.
 *
 * Never returns null; returns `{}` for the SUPER_ADMIN case so callers can
 * still merge additional conditions safely.
 */

import { ObjectId } from 'mongodb';

/**
 * @param {object} session — next-auth session (or null/undefined for public)
 * @param {object} [options]
 * @param {string[]} [options.userFields]  — extra fields (besides userId,
 *   createdBy) that should match the current userId. E.g. ['machineCreatorId'].
 * @returns {object} a Mongo filter, possibly `{}`
 */
export function buildOrgScopeFilter(session, options = {}) {
  if (!session || !session.user) return {};

  const role = session.user.role;
  const userId = session.user.id;
  const organization = session.user.organization || session.user.company || null;
  let credentialId = session.user.credentialId || null;

  // Convert credentialId string to ObjectId when possible
  if (credentialId && typeof credentialId === 'string' && ObjectId.isValid(credentialId)) {
    credentialId = new ObjectId(credentialId);
  }

  // 1. SUPER_ADMIN → global read
  if (role === 'SUPER_ADMIN') return {};

  // 2. ADMIN with organization → org + own
  if ((role === 'ADMIN' || role === 'admin') && organization) {
    const or = [
      { organization },
      { userId },
      { createdBy: userId },
    ];
    (options.userFields || []).forEach((f) => or.push({ [f]: userId }));
    return { $or: or };
  }

  // 3. Regular user with credentialId
  if (credentialId) {
    return { credentialId };
  }

  // 4. Fallback: filter strictly by userId
  if (userId) {
    const or = [
      { userId },
      { createdBy: userId },
    ];
    (options.userFields || []).forEach((f) => or.push({ [f]: userId }));
    return { $or: or };
  }

  // No usable identity — return an impossible filter to be safe
  return { _id: null };
}

/**
 * True when the session is a SUPER_ADMIN (global access).
 */
export function isSuperAdmin(session) {
  return !!session?.user && session.user.role === 'SUPER_ADMIN';
}

/**
 * True when the current user should see data across the whole org
 * (as opposed to only records they personally created).
 */
export function hasOrgScope(session) {
  if (!session?.user) return false;
  if (session.user.role === 'SUPER_ADMIN') return true;
  if ((session.user.role === 'ADMIN' || session.user.role === 'admin') && (session.user.organization || session.user.company)) {
    return true;
  }
  return false;
}
