import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import AllocationResult from "../components/AllocationResult";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENT_OPTIONS = ["whole_blood", "packed_rbc", "plasma", "platelets"];
const URGENCY_OPTIONS = ["routine", "urgent", "emergency"];
const STATUS_OPTIONS = ["pending"];

function formatComponent(component) {
  return component
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BloodRequests() {
  const { user } = useAuth();

  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [allocationData, setAllocationData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [creating, setCreating] = useState(false);
  const [requestForm, setRequestForm] = useState({
    hospital_id: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    component: COMPONENT_OPTIONS[0],
    units_needed: 1,
    urgency: URGENCY_OPTIONS[0],
    status: STATUS_OPTIONS[0],
    notes: ""
  });

  const canCreateRequest = user?.role === "hospital_staff";
  const canFulfill = user?.role === "admin";

  const load = async () => {
    const endpoint = tab === "pending" ? "/requests/pending" : "/requests?status=fulfilled";
    const { data } = await api.get(endpoint);
    setRequests(data);
  };

  const loadHospitals = async () => {
    if (!canCreateRequest) {
      return;
    }
    const { data } = await api.get("/hospitals");
    setHospitals(data);
    if (data.length) {
      setRequestForm((prev) => ({ ...prev, hospital_id: prev.hospital_id || data[0].id }));
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    loadHospitals();
  }, [canCreateRequest]);

  const createRequest = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        ...requestForm,
        units_needed: Number(requestForm.units_needed),
        notes: requestForm.notes?.trim() ? requestForm.notes.trim() : null
      };
      await api.post("/requests", payload);
      toast.success("Blood request submitted");
      setRequestForm((prev) => ({ ...prev, units_needed: 1, notes: "", status: "pending" }));
      load();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to create request");
    } finally {
      setCreating(false);
    }
  };

  const fulfill = async (id) => {
    try {
      const { data } = await api.post(`/requests/${id}/fulfill`);
      setAllocationData(data.allocations || []);
      toast.success("Request fulfilled");
      const targetTab = "all";
      if (tab !== targetTab) {
        setTab(targetTab);
      } else {
        load();
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Fulfillment failed");
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return "bg-red-50 text-red-700 border-l-4 border-red-700";
      case "urgent":
        return "bg-orange-50 text-orange-700 border-l-4 border-orange-700";
      default:
        return "bg-blue-50 text-blue-700 border-l-4 border-blue-700";
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Blood Requests</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">
          Manage and fulfill blood requests
        </p>
      </div>

      {canCreateRequest && (
        <form
          onSubmit={createRequest}
          className="rounded-lg bg-surface dark:bg-gray-800 p-5 shadow-ambient dark:shadow-none dark:border dark:border-gray-700"
        >
          <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Create New Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              required
              value={requestForm.hospital_id}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, hospital_id: e.target.value }))}
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>

            <select
              value={requestForm.blood_group}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, blood_group: e.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={requestForm.component}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, component: e.target.value }))}
            >
              {COMPONENT_OPTIONS.map((component) => (
                <option key={component} value={component}>
                  {formatComponent(component)}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              required
              value={requestForm.units_needed}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, units_needed: e.target.value }))}
              placeholder="Units Needed"
            />

            <select
              value={requestForm.urgency}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md capitalize"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, urgency: e.target.value }))}
            >
              {URGENCY_OPTIONS.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency}
                </option>
              ))}
            </select>

            <select
              value={requestForm.status}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md capitalize"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={requestForm.notes}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 px-4 py-3 text-body-md md:col-span-3"
              onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !requestForm.hospital_id}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 font-semibold disabled:opacity-70"
          >
            {creating ? "Submitting..." : "Add Blood Request"}
          </button>
        </form>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-lg text-body-md font-medium transition-all ${
            tab === "pending"
              ? "bg-gradient-to-r from-primary to-primary-container text-on-primary"
              : "bg-surface-container-high dark:bg-gray-700 text-on-surface dark:text-gray-200 hover:bg-surface-container dark:hover:bg-gray-600 transition-colors"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-lg text-body-md font-medium transition-all ${
            tab === "all"
              ? "bg-gradient-to-r from-primary to-primary-container text-on-primary"
              : "bg-surface-container-high dark:bg-gray-700 text-on-surface dark:text-gray-200 hover:bg-surface-container dark:hover:bg-gray-600 transition-colors"
          }`}
        >
          All Requests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.length === 0 ? (
          <p className="text-body-md text-on-surface-variant dark:text-gray-400">No requests found</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className={`rounded-lg p-6 shadow-ambient ${getUrgencyColor(r.urgency)}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold">{r.blood_group}</p>
                  <p className="text-body-md mt-1">{formatComponent(r.component)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-label-md font-semibold bg-white/50 capitalize">
                  {r.urgency}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-body-md"><span className="font-semibold">Units Needed:</span> {r.units_needed}</p>
                <p className="text-body-md"><span className="font-semibold">Status:</span> {r.status}</p>
              </div>

              {tab === "pending" && canFulfill && (
                <button
                  onClick={() => fulfill(r.id)}
                  className="w-full rounded-lg bg-white/30 hover:bg-white/50 px-4 py-2 font-semibold transition-all"
                >
                  Fulfill Request
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {allocationData && <AllocationResult units={allocationData} />}
    </div>
  );
}
