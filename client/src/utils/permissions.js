/**
 * Centralized Role-Based Permission System for CampusSphere ERP.
 * Defines explicit permissions per role according to institutional privilege bounds.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COLLEGE_ADMIN: 'COLLEGE_ADMIN',
  HOD: 'HOD',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
};

const ADMIN_TIER_ROLES = [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN];

/**
 * Checks if a user role can perform CREATE operation on an entity.
 */
export const canCreate = (userRole, entityType) => {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;

  switch (entityType) {
    case 'DEPARTMENT':
    case 'COURSE':
    case 'BRANCH':
    case 'USER':
    case 'ID_CARD':
    case 'CERTIFICATE':
    case 'REPORT':
      return userRole === ROLES.COLLEGE_ADMIN;
    case 'SUBJECT':
    case 'NOTICE':
      return [ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY].includes(userRole);
    default:
      return false;
  }
};

/**
 * Checks if a user role can perform READ operation on an entity.
 */
export const canRead = (userRole, entityType) => {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.COLLEGE_ADMIN) return true;

  switch (entityType) {
    case 'AUDIT_LOG':
    case 'COLLEGE_PROFILE':
    case 'BULK_PROMOTION':
      return userRole === ROLES.SUPER_ADMIN;
    default:
      return true;
  }
};

/**
 * Checks if a user role can perform UPDATE operation on an entity.
 */
export const canUpdate = (userRole, entityType) => {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;

  switch (entityType) {
    case 'DEPARTMENT':
    case 'COURSE':
    case 'BRANCH':
    case 'USER':
      return userRole === ROLES.COLLEGE_ADMIN;
    case 'SUBJECT':
      return [ROLES.COLLEGE_ADMIN, ROLES.HOD].includes(userRole);
    case 'NOTICE':
      return [ROLES.COLLEGE_ADMIN, ROLES.HOD, ROLES.FACULTY].includes(userRole);
    default:
      return false;
  }
};

/**
 * Checks if a user role can perform DELETE (or soft-deactivate/archive) operation on an entity.
 * For user entities, targetUserRole must also be passed to enforce privilege escalation guards.
 */
export const canDelete = (userRole, entityType, targetUserRole = null) => {
  if (!userRole) return false;

  // Super Admin can delete anything within policy
  if (userRole === ROLES.SUPER_ADMIN) {
    return true;
  }

  // College Admin permissions
  if (userRole === ROLES.COLLEGE_ADMIN) {
    switch (entityType) {
      case 'DEPARTMENT':
      case 'COURSE':
      case 'BRANCH':
      case 'SUBJECT':
      case 'NOTICE':
        return true;
      case 'USER':
      case 'PERMANENT_USER_DELETE':
        // College Admin can delete/deactivate/permanently delete STUDENT, FACULTY, HOD accounts
        if (targetUserRole && ADMIN_TIER_ROLES.includes(targetUserRole)) {
          return false;
        }
        return true;
      case 'ACADEMIC_CALENDAR':
      case 'COLLEGE_PROFILE':
      case 'BULK_PROMOTION':
      case 'AUDIT_LOG':
        return false;
      default:
        return false;
    }
  }

  // HOD permissions
  if (userRole === ROLES.HOD) {
    switch (entityType) {
      case 'SUBJECT':
      case 'NOTICE':
        return true;
      case 'USER':
        // HOD can soft delete FACULTY and STUDENT in their dept (enforced backend)
        return targetUserRole === ROLES.FACULTY || targetUserRole === ROLES.STUDENT;
      default:
        return false;
    }
  }

  // Faculty permissions
  if (userRole === ROLES.FACULTY) {
    return entityType === 'NOTICE';
  }

  return false;
};

/**
 * Privilege Escalation Guard Check:
 * Checks whether an actor can target a specific user based on roles.
 */
export const canActOnUser = (actorRole, targetUserRole) => {
  if (!actorRole || !targetUserRole) return false;
  if (actorRole === ROLES.SUPER_ADMIN) return true;

  if (actorRole === ROLES.COLLEGE_ADMIN) {
    // College Admin cannot act on Super Admin or College Admin accounts
    return !ADMIN_TIER_ROLES.includes(targetUserRole);
  }

  if (actorRole === ROLES.HOD) {
    // HOD can only act on Faculty or Student accounts
    return targetUserRole === ROLES.FACULTY || targetUserRole === ROLES.STUDENT;
  }

  return false;
};

/**
 * Custom React hook for permission checks based on current authenticated user context.
 */
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role;

  return {
    role,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isCollegeAdmin: role === ROLES.COLLEGE_ADMIN,
    isHod: role === ROLES.HOD,
    isFaculty: role === ROLES.FACULTY,
    isStudent: role === ROLES.STUDENT,
    isAdmin: role === ROLES.SUPER_ADMIN || role === ROLES.COLLEGE_ADMIN,
    canCreate: (entityType) => canCreate(role, entityType),
    canRead: (entityType) => canRead(role, entityType),
    canUpdate: (entityType) => canUpdate(role, entityType),
    canDelete: (entityType, targetUserRole) => canDelete(role, entityType, targetUserRole),
    canActOnUser: (targetUserRole) => canActOnUser(role, targetUserRole),
  };
};
