import { useEffect, useState } from "react";

import api from "../api/axios";

export default function Hospitals() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/hospitals").then((res) => setRows(res.data));
  }, []);

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Hospital Management</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">View and manage partner hospitals</p>
      </div>
      
      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Contact Person</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Phone</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <p className="text-body-md text-on-surface-variant dark:text-gray-400">No hospitals found</p>
                  </td>
                </tr>
              ) : (
                rows.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-medium text-on-surface dark:text-gray-200">{h.name}</td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200">{h.contact_person || "—"}</td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">{h.phone_number || "—"}</td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400 break-all">{h.email || "—"}</td>
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
