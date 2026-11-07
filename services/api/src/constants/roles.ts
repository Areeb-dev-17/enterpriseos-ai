export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    MEMBER: "member",
  } as const;
  
  export type UserRole = (typeof ROLES)[keyof typeof ROLES];