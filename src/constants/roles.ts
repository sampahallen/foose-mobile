/** Kept in sync with `backend/src/constants/roles.js` and `frontend/src/constants/roles.ts`. */
export const USER_ROLES = {
  STANDARD_USER: 1001,
  KYC_REVIEWER: 2001,
  COMMUNITY_MODERATOR: 3001,
  DISPUTE_RESOLVER: 4001,
  SUPER_ADMIN: 9001,
} as const

export const ROLE_KEYS = {
  STANDARD_USER: 'standardUser',
  KYC_REVIEWER: 'kycReviewer',
  COMMUNITY_MODERATOR: 'communityModerator',
  DISPUTE_RESOLVER: 'disputeResolver',
  SUPER_ADMIN: 'superAdmin',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS]
export type UserRoles = Partial<Record<RoleKey, UserRole>>
