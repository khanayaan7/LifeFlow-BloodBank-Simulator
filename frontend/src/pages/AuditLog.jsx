import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import api from "../api/axios";

export default function AuditLog() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/audit").then((res) => setRows(res.data));
  }, []);

  const getActionColor = (action) => {
    if (action?.includes("CREATE")) return "bg-blue-50 text-blue-700";
    if (action?.includes("DELETE")) return "bg-red-50 text-red-700";
    if (action?.includes("UPDATE")) return "bg-orange-50 text-orange-700";
    return "bg-surface-container-low text-on-surface-variant";
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Audit Log</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Complete action history for compliance and security</p>
      </div>

      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Timestamp</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Action</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Entity</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <p className="text-body-md text-on-surface-variant dark:text-gray-400">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-3 font-medium text-on-surface dark:text-gray-200">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3 text-on-surface-variant dark:text-gray-400">{a.user_id ? a.user_id.substring(0, 8) + "..." : "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${getActionColor(a.action)} ${a.action?.includes("CREATE") ? "dark:bg-blue-900/30 dark:text-blue-400" : a.action?.includes("DELETE") ? "dark:bg-red-900/30 dark:text-red-400" : a.action?.includes("UPDATE") ? "dark:bg-orange-900/30 dark:text-orange-400" : "dark:bg-gray-700 dark:text-gray-300"}`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-on-surface dark:text-gray-200">{a.entity_type} / {a.entity_id?.substring(0, 8)}...</td>
                    <td className="px-6 py-3 text-on-surface-variant dark:text-gray-400 text-xs max-w-xs truncate">
                      {a.details ? JSON.stringify(a.details) : "—"}
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
