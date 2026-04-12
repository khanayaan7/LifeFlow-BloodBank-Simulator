import { AlertTriangle } from "lucide-react";

export default function ViolationAlert({ count }) {
  if (!count) return null;
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border-l-4 border-error px-6 py-4 flex gap-4">
      <AlertTriangle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-error dark:text-red-400 text-body-md">Active Cold Chain Alerts</h3>
        <p className="text-error/80 dark:text-red-400/80 text-body-sm mt-1">
          {count} cold chain violation{count !== 1 ? "s" : ""} detected. Immediate investigation required.
        </p>
      </div>
    </div>
  );
}
