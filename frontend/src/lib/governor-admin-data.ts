// Shared admin types. All data is now fetched from the backend.

export type UserRole = "Citizen" | "Technician" | "DistrictManager" | "Governor";

export const ROLE_OPTIONS: UserRole[] = [
  "Citizen",
  "Technician",
  "DistrictManager",
  "Governor",
];

export const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];
