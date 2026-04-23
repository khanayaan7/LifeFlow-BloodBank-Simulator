const ROLE_COLORS = {
  admin: "bg-primary/10 text-primary",
  lab_technician: "bg-blue-100 text-blue-700",
  hospital_staff: "bg-green-100 text-green-700",
  auditor: "bg-purple-100 text-purple-700",
  donor: "bg-rose-100 text-rose-700"
};

export default function RoleBadge({ role }) {
  const colorClass = ROLE_COLORS[role] || "bg-surface-container-high text-on-surface-variant";
  const displayRole = role?.replace(/_/g, " ").toUpperCase() || "GUEST";
  
  return (
    <span className={`rounded-full px-3 py-1 text-label-md font-medium uppercase tracking-wide ${colorClass}`}>
      {displayRole}
    </span>
  );
}
