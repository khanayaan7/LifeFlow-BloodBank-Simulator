import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import api from "../api/axios";
import ViolationAlert from "../components/ViolationAlert";

export default function Violations() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/violations").then((res) => setRows(res.data));
  }, []);

  const activeCount = rows.filter((r) => !r.resolved_at).length;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "minor":
        return "bg-yellow-50 text-yellow-700";
      case "moderate":
        return "bg-orange-50 text-orange-700";
      case "critical":
        return "bg-red-50 text-red-700";
      default:
        return "bg-surface-container-low text-on-surface";
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Cold Chain Violations</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Monitor and manage temperature violations</p>
      </div>

      <ViolationAlert count={activeCount} />

      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Storage Unit</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Temperature</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Duration</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Severity</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Time</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <p className="text-body-md text-on-surface-variant dark:text-gray-400">No violations recorded</p>
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-medium text-on-surface dark:text-gray-200">{v.storage_unit_id}</td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200">{v.threshold_breached}°C</td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200">{v.duration_minutes || "—"} min</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${getSeverityColor(v.severity)} ${v.severity?.toLowerCase() === "minor" ? "dark:bg-yellow-900/30 dark:text-yellow-400" : v.severity?.toLowerCase() === "moderate" ? "dark:bg-orange-900/30 dark:text-orange-400" : v.severity?.toLowerCase() === "critical" ? "dark:bg-red-900/30 dark:text-red-400" : "dark:bg-gray-700 dark:text-gray-300"}`}>
                        {v.severity || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">{new Date(v.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${v.resolved_at ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                        {v.resolved_at ? "Resolved" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
