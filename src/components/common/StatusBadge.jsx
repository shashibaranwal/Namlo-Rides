import { S } from "../../state/rideMachine";

const STYLES = {
  [S.IDLE]: ["Idle", "bg-gray-100 text-gray-600"],
  [S.REQUESTING]: ["Requesting", "bg-amber-100 text-amber-700"],
  [S.ACCEPTED]: ["Accepted", "bg-blue-100 text-blue-700"],
  [S.EN_ROUTE]: ["Driver en route", "bg-indigo-100 text-indigo-700"],
  [S.ARRIVED]: ["Driver arrived", "bg-violet-100 text-violet-700"],
  [S.IN_PROGRESS]: ["In progress", "bg-cyan-100 text-cyan-700"],
  [S.COMPLETED]: ["Completed", "bg-green-100 text-green-700"],
  [S.CANCELLED]: ["Cancelled", "bg-red-100 text-red-700"],
  [S.REJECTED]: ["Rejected", "bg-rose-100 text-rose-700"],
};

export default function StatusBadge({ status }) {
  const [label, cls] = STYLES[status] || ["Unknown", "bg-gray-100 text-gray-600"];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
