import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    age: 18,
    phone_number: "",
    email: "",
    last_donation: ""
  });

  const canManageDonors = user?.role === "admin" || user?.role === "lab_technician";

  const loadDonors = async () => {
    const res = await api.get("/donors");
    setRows(res.data);
  };

  useEffect(() => {
    loadDonors().catch(() => {
      toast.error("Failed to load donors");
    });
  }, []);

  const createDonor = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        age: Number(form.age),
        email: form.email?.trim() ? form.email.trim() : null,
        last_donation: form.last_donation || null
      };
      await api.post("/donors", payload);
      toast.success("Donor added");
      setForm((prev) => ({
        ...prev,
        full_name: "",
        age: 18,
        phone_number: "",
        email: "",
        last_donation: ""
      }));
      await loadDonors();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to add donor");
    } finally {
      setSubmitting(false);
    }
  };

  const removeDonor = async (donor) => {
    if (!window.confirm(`Remove donor ${displayDonorName(donor.full_name)}?`)) {
      return;
    }
    try {
      await api.delete(`/donors/${donor.id}`);
      toast.success("Donor removed");
      await loadDonors();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to remove donor");
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Donor Registry</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Manage donor information and donation history</p>
      </div>

      {canManageDonors && (
        <form
          onSubmit={createDonor}
          className="rounded-lg bg-surface dark:bg-gray-800 p-5 shadow-ambient dark:shadow-none dark:border dark:border-gray-700"
        >
          <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Add Donor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              required
              type="text"
              value={form.full_name}
              placeholder="Full name"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            />

            <select
              value={form.blood_group}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="18"
              max="65"
              value={form.age}
              placeholder="Age"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
            />

            <input
              required
              type="text"
              value={form.phone_number}
              placeholder="Phone number"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
            />

            <input
              type="email"
              value={form.email}
              placeholder="Email (optional)"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />

            <input
              type="date"
              value={form.last_donation}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, last_donation: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 font-semibold disabled:opacity-70"
          >
            {submitting ? "Adding..." : "Add Donor"}
          </button>
        </form>
      )}
      
      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Blood Group</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Last Donation</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Eligibility</th>
                {canManageDonors && <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManageDonors ? 5 : 4} className="px-6 py-8 text-center">
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
                    {canManageDonors && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => removeDonor(d)}
                          disabled={!d.is_eligible}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-label-md font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {d.is_eligible ? "Remove" : "Removed"}
                        </button>
                      </td>
                    )}
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
