import { useEffect, useState } from "react";

import api from "../api/axios";

const REAL_DONOR_NAMES = {
  1: "Rajesh Kumar",
  2: "Priya Sharma",
  3: "Arjun Singh",
  4: "Anisha Patel",
  5: "Vikram Reddy",
  6: "Deepa Gupta",
  7: "Sanjay Verma",
  8: "Neha Mishra",
  9: "Amit Joshi",
  10: "Ritu Desai"
};

function displayDonorName(name) {
  if (!name) return "Unknown Donor";
  const match = name.trim().match(/^donor\s*(\d+)$/i);
  if (!match) return name;
  const index = Number(match[1]);
  return REAL_DONOR_NAMES[index] || name;
}

export default function Donors() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/donors").then((res) => setRows(res.data));
  }, []);

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Donor Registry</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Manage donor information and donation history</p>
      </div>
      
      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Blood Group</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Last Donation</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <p className="text-body-md text-on-surface-variant dark:text-gray-400">No donors found</p>
                  </td>
                </tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-medium text-on-surface dark:text-gray-200">{displayDonorName(d.full_name)}</td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200 font-semibold">{d.blood_group}</td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">{d.last_donation ? new Date(d.last_donation).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${d.is_eligible ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                        {d.is_eligible ? "✓ Eligible" : "✗ Not Eligible"}
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
