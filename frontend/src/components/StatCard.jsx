import { TrendingUp, Droplet, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const ICON_MAP = {
  "Total Units": Droplet,
  "Available Units": CheckCircle2,
  "Expiring Soon": AlertCircle,
  "Active Violations": AlertCircle,
  "Pending Requests": Clock
};

const COLORS = {
  "Total Units": "text-on-surface",
  "Available Units": "text-success",
  "Expiring Soon": "text-warning",
  "Active Violations": "text-error",
  "Pending Requests": "text-on-surface-variant"
};

const BG_COLORS = {
  "Total Units": "bg-surface-container-low dark:bg-gray-800",
  "Available Units": "bg-green-50 dark:bg-green-900/20",
  "Expiring Soon": "bg-orange-50 dark:bg-orange-900/20",
  "Active Violations": "bg-red-50 dark:bg-red-900/20",
  "Pending Requests": "bg-blue-50 dark:bg-blue-900/20"
};

const STATUS_TEXT = {
  "Total Units": "Stable",
  "Available Units": "Stable",
  "Expiring Soon": "Critical Action",
  "Active Violations": "High Priority",
  "Pending Requests": "Awaiting Prep"
};

export default function StatCard({ title, value, colorClass = "bg-on-surface" }) {
  const Icon = ICON_MAP[title] || Droplet;
  const textColor = COLORS[title] || "text-on-surface";
  const bgColor = BG_COLORS[title] || "bg-surface-container-low";
  const statusText = STATUS_TEXT[title] || "Status";
  const isViolation = title === "Active Violations";

  return (
    <div className={`relative rounded-lg p-6 shadow-ambient transition-all hover:shadow-lg dark:shadow-none dark:border dark:border-gray-700 ${bgColor}`}>
      {/* Left Accent Bar for Violations */}
      {isViolation && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-b from-primary to-primary-container" />}

      {/* Icon */}
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/60 dark:bg-gray-700">
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>

      {/* Title */}
      <p className="mt-4 text-label-md font-medium text-on-surface-variant dark:text-gray-400 uppercase tracking-wide">{title}</p>

      {/* Value */}
      <p className="mt-2 text-4xl font-bold text-on-surface dark:text-white">{value}</p>

      {/* Status/Trend */}
      <div className="mt-3 flex items-center gap-1">
        {title === "Total Units" && (
          <>
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-label-md text-success font-semibold">+4.2%</span>
          </>
        )}
        {title !== "Total Units" && (
          <span className={`text-label-md font-medium ${title === "Active Violations" ? "text-error" : title === "Expiring Soon" ? "text-warning" : "text-on-surface-variant dark:text-gray-400"}`}>
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
}
