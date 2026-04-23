import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";

const BLOOD_GROUP_OPTIONS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toDateInputValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function Donors() {
  const [rows, setRows] = useState([]);
  const [editingDonorId, setEditingDonorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    blood_group: "",
    age: "",
    last_donation: ""
  });

  const loadDonors = async () => {
    const res = await api.get("/donors");
    setRows(res.data);
  };

  useEffect(() => {
    loadDonors().catch(() => {
      toast.error("Failed to load donors");
    });
  }, []);

  const startEdit = (donor) => {
    setEditingDonorId(donor.id);
    setForm({
      full_name: donor.full_name || "",
      email: donor.email || "",
      phone_number: donor.phone_number || "",
      blood_group: donor.blood_group || "",
      age: donor.age ?? "",
      last_donation: toDateInputValue(donor.last_donation)
    });
  };

  const cancelEdit = () => {
    setEditingDonorId(null);
    setForm({
      full_name: "",
      email: "",
      phone_number: "",
      blood_group: "",
      age: "",
      last_donation: ""
    });
  };

  const updateDonor = async (event) => {
    event.preventDefault();
    if (!editingDonorId) return;

    try {
      setSubmitting(true);
      await api.put(`/donors/${editingDonorId}`, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        blood_group: form.blood_group || null,
        age: form.age ? Number(form.age) : null,
        last_donation: form.last_donation || null
      });
      toast.success("Donor updated");
      cancelEdit();
      await loadDonors();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update donor");
    } finally {
      setSubmitting(false);
    }
  };

  const removeDonor = async (donor) => {
    if (!window.confirm(`Deactivate donor ${donor.full_name}?`)) {
      return;
    }

    try {
      await api.delete(`/donors/${donor.id}`);
      toast.success("Donor deactivated");
      if (editingDonorId === donor.id) {
        cancelEdit();
      }
      await loadDonors();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to deactivate donor");
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Donor Registry</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">
          Donors now self-register. Staff can review, edit, and deactivate donor records here.
        </p>
      </div>

      {editingDonorId && (
        <form
          onSubmit={updateDonor}
          className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-on-surface dark:text-white">Edit Donor</h2>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface dark:bg-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              required
              type="text"
              value={form.full_name}
              placeholder="Full name"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
            />
            <input
              required
              type="email"
              value={form.email}
              placeholder="Email"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              required
              type="text"
              value={form.phone_number}
              placeholder="Phone number"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
            />
            <select
              value={form.blood_group}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, blood_group: event.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group || "empty"} value={group}>
                  {group || "Blood Group Pending"}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="18"
              max="65"
              value={form.age}
              placeholder="Age"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
            />
            <input
              type="date"
              value={form.last_donation}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, last_donation: event.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 font-semibold text-on-primary disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl bg-surface shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="border-b border-surface-container-high bg-surface-container-low dark:border-gray-600 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Donor ID</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Contact</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Blood Group</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Last Donation</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Eligibility</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant dark:text-gray-400">
                    No donors found
                  </td>
                </tr>
              ) : (
                rows.map((donor) => (
                  <tr key={donor.id} className="transition-colors hover:bg-surface-container-low dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-semibold text-primary">{donor.donor_code}</td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200">{donor.full_name}</td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">
                      <div>{donor.email}</div>
                      <div>{donor.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 text-on-surface dark:text-gray-200">{donor.blood_group || "Pending"}</td>
                    <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">
                      {donor.last_donation ? new Date(donor.last_donation).toLocaleDateString() : "No donation yet"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-label-md font-semibold ${
                          donor.is_eligible
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {donor.is_eligible ? "Eligible" : "Recovery Window"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(donor)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-label-md font-semibold text-on-primary hover:bg-primary-container"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeDonor(donor)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-label-md font-semibold text-white hover:bg-red-700"
                        >
                          Deactivate
                        </button>
                      </div>
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
