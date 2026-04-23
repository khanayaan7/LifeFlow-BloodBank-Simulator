import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Droplets, FileBadge2, HeartPulse, MapPin, Receipt } from "lucide-react";

import api from "../api/axios";

function formatComponent(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function DonorDashboard() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api
      .get("/donors/me/dashboard")
      .then((res) => setDashboard(res.data))
      .catch((error) => {
        toast.error(error?.response?.data?.detail || "Failed to load donor dashboard");
      });
  }, []);

  if (!dashboard) {
    return <div className="flex h-96 items-center justify-center text-on-surface-variant">Loading donor dashboard...</div>;
  }

  const { donor, receipts } = dashboard;

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-container to-rose-700 p-8 text-white shadow-2xl">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Donor Dashboard</p>
            <div>
              <h1 className="font-display text-4xl font-bold">{donor.full_name}</h1>
              <p className="mt-2 max-w-2xl text-white/85">
                Your donor ID is {donor.donor_code}. Every donation receipt and allocation update is tracked here in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/85">
              <span className="rounded-full bg-white/15 px-4 py-2">{donor.email}</span>
              <span className="rounded-full bg-white/15 px-4 py-2">{donor.phone_number}</span>
              <span className="rounded-full bg-white/15 px-4 py-2">{donor.blood_group || "Blood group pending screening"}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/70">Total Donations</p>
              <p className="mt-2 text-3xl font-bold">{dashboard.total_donations}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/70">Allocated Units</p>
              <p className="mt-2 text-3xl font-bold">{dashboard.allocated_units}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/70">Donation Eligibility</p>
              <p className="mt-2 text-2xl font-bold">{donor.is_eligible ? "Eligible" : "Recovery Window"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Receipts Available</p>
              <p className="text-2xl font-bold text-on-surface dark:text-white">{receipts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Latest Donation</p>
              <p className="text-2xl font-bold text-on-surface dark:text-white">
                {dashboard.latest_donation_date ? new Date(dashboard.latest_donation_date).toLocaleDateString() : "No donations yet"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">Current Blood Group</p>
              <p className="text-2xl font-bold text-on-surface dark:text-white">{donor.blood_group || "Pending"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface dark:text-white">Donation Receipts</h2>
          <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">
            Each receipt shows your donation details and, if allocated, the hospital and patient details tied to that unit.
          </p>
        </div>

        {receipts.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800">
            <p className="text-on-surface-variant dark:text-gray-400">No donations have been recorded for your donor profile yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {receipts.map((receipt) => (
              <article
                key={receipt.unit_id}
                className="overflow-hidden rounded-[24px] bg-surface shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="border-b border-surface-container-low bg-gradient-to-r from-rose-50 via-white to-rose-100 px-6 py-5 dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Donation Receipt</p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-on-surface dark:text-white">{receipt.unit_code}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant dark:text-gray-400">Donor ID: {receipt.donor_code}</p>
                    </div>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        receipt.status === "allocated"
                          ? "bg-blue-100 text-blue-700"
                          : receipt.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {receipt.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-surface-container-low p-4 dark:bg-gray-700">
                      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface dark:text-white">
                        <FileBadge2 className="h-4 w-4 text-primary" />
                        Donor Details
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-on-surface-variant dark:text-gray-300">
                        <p><span className="font-semibold text-on-surface dark:text-white">Name:</span> {receipt.donor_name}</p>
                        <p><span className="font-semibold text-on-surface dark:text-white">Email:</span> {receipt.donor_email}</p>
                        <p><span className="font-semibold text-on-surface dark:text-white">Phone:</span> {receipt.donor_phone_number}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface-container-low p-4 dark:bg-gray-700">
                      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface dark:text-white">
                        <Droplets className="h-4 w-4 text-primary" />
                        Donation Details
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-on-surface-variant dark:text-gray-300">
                        <p><span className="font-semibold text-on-surface dark:text-white">Blood Type:</span> {receipt.blood_group}</p>
                        <p><span className="font-semibold text-on-surface dark:text-white">Component:</span> {formatComponent(receipt.component)}</p>
                        <p><span className="font-semibold text-on-surface dark:text-white">Volume:</span> {receipt.volume_ml} ml</p>
                        <p><span className="font-semibold text-on-surface dark:text-white">Collected On:</span> {new Date(receipt.collection_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-container-low p-4 dark:bg-gray-700">
                    <div className="flex items-center gap-2 text-sm font-semibold text-on-surface dark:text-white">
                      <MapPin className="h-4 w-4 text-primary" />
                      Blood Bank Details
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-on-surface-variant dark:text-gray-300">
                      <p><span className="font-semibold text-on-surface dark:text-white">Blood Bank:</span> {receipt.blood_bank_name || "Pending assignment"}</p>
                      <p><span className="font-semibold text-on-surface dark:text-white">Location:</span> {receipt.blood_bank_location || "Will appear after donation is recorded at a branch"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-container-low p-4 dark:bg-gray-700">
                    <div className="flex items-center gap-2 text-sm font-semibold text-on-surface dark:text-white">
                      <HeartPulse className="h-4 w-4 text-primary" />
                      Allocation Status
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-on-surface-variant dark:text-gray-300">
                      <p><span className="font-semibold text-on-surface dark:text-white">Hospital:</span> {receipt.hospital_name || "Not allocated yet"}</p>
                      <p><span className="font-semibold text-on-surface dark:text-white">Patient Name:</span> {receipt.patient_name || "-"}</p>
                      <p><span className="font-semibold text-on-surface dark:text-white">Patient ID:</span> {receipt.patient_id || "-"}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
