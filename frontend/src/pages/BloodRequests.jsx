import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import AllocationResult from "../components/AllocationResult";
import { useAuth } from "../context/AuthContext";

export default function BloodRequests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [allocationData, setAllocationData] = useState(null);
  const canFulfill = ["admin", "lab_technician"].includes(user?.role);

  const load = async () => {
    const endpoint = tab === "pending" ? "/requests/pending" : "/requests?status=fulfilled";
    const { data } = await api.get(endpoint);
    setRequests(data);
  };

  useEffect(() => {
    load();
  }, [tab]);

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
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Manage and fulfill blood requests</p>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-lg text-body-md font-medium transition-all ${tab === "pending" ? "bg-gradient-to-r from-primary to-primary-container text-on-primary" : "bg-surface-container-high dark:bg-gray-700 text-on-surface dark:text-gray-200 hover:bg-surface-container dark:hover:bg-gray-600 transition-colors"}`}
        >
          Pending
        </button>
        <button 
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-lg text-body-md font-medium transition-all ${tab === "all" ? "bg-gradient-to-r from-primary to-primary-container text-on-primary" : "bg-surface-container-high dark:bg-gray-700 text-on-surface dark:text-gray-200 hover:bg-surface-container dark:hover:bg-gray-600 transition-colors"}`}
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
                  <p className="text-body-md mt-1">{r.component}</p>
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
                  className="w-full mt-3 rounded-lg bg-white/30 hover:bg-white/50 px-4 py-2 font-semibold transition-all"
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
