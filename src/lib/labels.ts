// Display copy — see specs/frontend-spec.md §4.
import type { OverallStatus, RegistrationStatus, Role, TeamRequestStatus, TeamRequestType } from "./types";

export type BadgeStatus = RegistrationStatus | TeamRequestStatus | OverallStatus | "NOT_STARTED";

export const STATUS_LABELS: Record<BadgeStatus, string> = {
  PENDING_HR_APPROVAL: "Pending HR Approval",
  PENDING_MANAGER_APPROVAL: "Pending Manager Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NOT_STARTED: "Not Started",
  REGISTRATION_PENDING: "Registration Pending",
  BASIC_IN_PROGRESS: "Basic Onboarding In Progress",
  AWAITING_TEAM_SELECTION: "Awaiting Team Selection",
  PENDING_TEAM_APPROVAL: "Pending Team Approval",
  TEAM_ONBOARDING_IN_PROGRESS: "Team-Specific Onboarding In Progress",
  COMPLETED: "Completed",
};

export const REQUEST_TYPE_LABELS: Record<TeamRequestType, string> = {
  NEW_JOINER: "New Joiner",
  INTERNAL_MOVEMENT: "Internal Movement",
};

export const ROLE_LABELS: Record<Role, string> = { HR: "HR", MANAGER: "Manager", EMPLOYEE: "Employee" };

export const ITEM_LABELS = { done: "Completed", notDone: "Not Completed" } as const;

// Copy taken word for word from the vision — do not reword.
export const COPY = {
  registrationSubmitted:
    "Your registration request has been submitted successfully. Your account will be activated once HR approves your request.",
  accountApproved: "Your account has been approved. Welcome aboard!",
  basicComplete: "Congratulations! You have completed your basic onboarding requirements.",
  movementWelcome:
    "Welcome! Please select your new team and reporting manager to begin your internal movement onboarding.",
  selfConfirmed: "Completion is self-confirmed by you and is not verified by any external system.",
  demoNotice: "Demo prototype — data is stored only in this browser.",
  resetConfirm:
    "Reset all demo data? This removes all registrations, requests and progress and restores the original demo users.",
  resetDone: "Demo data has been reset.",
} as const;

/** "2026-10-18" → "18 Oct 2026"; full timestamps use the viewer's local date. */
export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const dateOnly = iso.length === 10;
  const d = new Date(dateOnly ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dateOnly && { timeZone: "UTC" }),
  });
}
