import { STATUS_LABELS, type BadgeStatus } from "@/lib/labels";

const AMBER = "bg-amber-100 text-amber-900 ring-amber-300";
const GREEN = "bg-green-100 text-green-900 ring-green-300";
const RED = "bg-red-100 text-red-900 ring-red-300";
const BLUE = "bg-blue-100 text-blue-900 ring-blue-300";
const GREY = "bg-gray-100 text-gray-800 ring-gray-300";

const COLORS: Record<BadgeStatus, string> = {
  PENDING_HR_APPROVAL: AMBER,
  PENDING_MANAGER_APPROVAL: AMBER,
  REGISTRATION_PENDING: AMBER,
  PENDING_TEAM_APPROVAL: AMBER,
  APPROVED: GREEN,
  COMPLETED: GREEN,
  REJECTED: RED,
  BASIC_IN_PROGRESS: BLUE,
  TEAM_ONBOARDING_IN_PROGRESS: BLUE,
  NOT_STARTED: GREY,
  AWAITING_TEAM_SELECTION: GREY,
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
