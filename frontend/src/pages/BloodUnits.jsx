import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";
import BloodUnitTable from "../components/BloodUnitTable";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENT_OPTIONS = ["whole_blood", "packed_rbc", "plasma", "platelets"];
const STATUS_OPTIONS = ["available", "reserved", "allocated", "expired", "quarantined"];

function toDateInputValue(value) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function formatLabel(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function donorLabel(donor) {
  const bloodGroup = donor.blood_group || "Pending Group";
  return `${donor.donor_code} - ${donor.full_name} (${bloodGroup})`;
}

export default function BloodUnits() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [donors, setDonors] = useState([]);
  const [filters, setFilters] = useState({ blood_group: "", status: "", component: "" });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [form, setForm] = useState({
    unit_code: "",
    donor_id: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    component: COMPONENT_OPTIONS[0],
    volume_ml: 350,
    storage_unit_id: "",
    expiry_date: "",
    status: "available",
    cold_chain_ok: "true"
  });
  const [editForm, setEditForm] = useState({
    unit_code: "",
    donor_id: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    component: COMPONENT_OPTIONS[0],
    volume_ml: 350,
    storage_unit_id: "",
    expiry_date: "",
    status: "available",
    cold_chain_ok: "true"
  });

  const canManageInventory = user?.role === "lab_technician" || user?.role === "admin";

  const loadFiltered = async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const { data } = await api.get("/blood-units", { params });
    setUnits(data);
  };

  const loadAllData = async () => {
    const [unitsRes, donorsRes] = await Promise.all([api.get("/blood-units"), api.get("/donors")]);
    setAllUnits(unitsRes.data);
    setDonors(donorsRes.data);
    if (!form.donor_id) {
      const firstEligible = (donorsRes.data || []).find((donor) => donor.is_eligible);
      if (firstEligible) {
        setForm((prev) => ({ ...prev, donor_id: firstEligible.id, blood_group: firstEligible.blood_group || prev.blood_group }));
      }
    }
  };

  const eligibleDonors = useMemo(() => donors.filter((donor) => donor.is_eligible), [donors]);

  const options = useMemo(() => {
    const unique = (key) => [...new Set(allUnits.map((unit) => unit[key]).filter(Boolean))].sort();
    return {
      bloodGroups: unique("blood_group"),
      statuses: unique("status"),
      components: unique("component")
    };
  }, [allUnits]);

  useEffect(() => {
    loadAllData().catch(() => toast.error("Failed to load inventory setup"));
  }, []);

  useEffect(() => {
    loadFiltered().catch(() => toast.error("Failed to load inventory"));
  }, [filters.blood_group, filters.status, filters.component]);

  const syncBloodGroupFromDonor = (donorId, targetSetter) => {
    const donor = donors.find((item) => item.id === donorId);
    if (!donor) return;
    targetSetter((prev) => ({
      ...prev,
      donor_id: donorId,
      blood_group: donor.blood_group || prev.blood_group
    }));
  };

  const createInventoryItem = async (event) => {
    event.preventDefault();
    try {
      setCreating(true);
      const payload = {
        unit_code: form.unit_code.trim(),
        donor_id: form.donor_id,
        blood_group: form.blood_group,
        component: form.component,
        volume_ml: Number(form.volume_ml),
        storage_unit_id: form.storage_unit_id.trim(),
        expiry_date: form.expiry_date,
        status: form.status,
        cold_chain_ok: form.cold_chain_ok === "true"
      };
      await api.post("/blood-units", payload);
      toast.success("Donation added to inventory");
      const firstEligible = eligibleDonors.find((donor) => donor.id !== form.donor_id) || eligibleDonors[0];
      setForm((prev) => ({
        ...prev,
        unit_code: "",
        donor_id: firstEligible?.id || "",
        blood_group: firstEligible?.blood_group || BLOOD_GROUP_OPTIONS[0],
        volume_ml: 350,
        storage_unit_id: "",
        expiry_date: "",
        status: "available",
        cold_chain_ok: "true"
      }));
      await Promise.all([loadFiltered(), loadAllData()]);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to add inventory item");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (unit) => {
    setEditingUnitId(unit.id);
    setEditForm({
      unit_code: unit.unit_code,
      donor_id: unit.donor_id || "",
      blood_group: unit.blood_group,
      component: unit.component,
      volume_ml: unit.volume_ml,
      storage_unit_id: unit.storage_unit_id || "",
      expiry_date: toDateInputValue(unit.expiry_date),
      status: unit.status,
      cold_chain_ok: unit.cold_chain_ok ? "true" : "false"
    });
  };

  const cancelEdit = () => {
    setEditingUnitId(null);
  };

  const updateInventoryItem = async (event) => {
    event.preventDefault();
    if (!editingUnitId) return;

    try {
      setUpdating(true);
      const payload = {
        unit_code: editForm.unit_code.trim(),
        donor_id: editForm.donor_id,
        blood_group: editForm.blood_group,
        component: editForm.component,
        volume_ml: Number(editForm.volume_ml),
        storage_unit_id: editForm.storage_unit_id.trim(),
        expiry_date: editForm.expiry_date,
        status: editForm.status,
        cold_chain_ok: editForm.cold_chain_ok === "true"
      };
      await api.put(`/blood-units/${editingUnitId}`, payload);
      toast.success("Inventory item updated");
      setEditingUnitId(null);
      await Promise.all([loadFiltered(), loadAllData()]);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update inventory item");
    } finally {
      setUpdating(false);
    }
  };

  const deleteInventoryItem = async (unit) => {
    if (!window.confirm(`Delete inventory unit ${unit.unit_code}?`)) {
      return;
    }

    try {
      await api.delete(`/blood-units/${unit.id}`);
      toast.success("Inventory item deleted");
      if (editingUnitId === unit.id) {
        setEditingUnitId(null);
      }
      await Promise.all([loadFiltered(), loadAllData()]);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to delete inventory item");
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Inventory</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">
          Each inventory entry now represents a donor-linked donation and carries allocation details when fulfilled.
        </p>
      </div>

      {canManageInventory && (
        <form
          onSubmit={createInventoryItem}
          className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="mb-4 font-display text-xl font-bold text-on-surface dark:text-white">Record Donation</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              required
              type="text"
              value={form.unit_code}
              placeholder="Unit Code"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, unit_code: event.target.value }))}
            />

            <select
              required
              value={form.donor_id}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => syncBloodGroupFromDonor(event.target.value, setForm)}
            >
              <option value="">Select donor</option>
              {eligibleDonors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donorLabel(donor)}
                </option>
              ))}
            </select>

            <select
              value={form.blood_group}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, blood_group: event.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={form.component}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, component: event.target.value }))}
            >
              {COMPONENT_OPTIONS.map((component) => (
                <option key={component} value={component}>
                  {formatLabel(component)}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              value={form.volume_ml}
              placeholder="Volume (ml)"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, volume_ml: event.target.value }))}
            />

            <input
              required
              type="text"
              value={form.storage_unit_id}
              placeholder="Storage Fridge"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, storage_unit_id: event.target.value }))}
            />

            <input
              required
              type="date"
              value={form.expiry_date}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, expiry_date: event.target.value }))}
            />

            <select
              value={form.status}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={form.cold_chain_ok}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setForm((prev) => ({ ...prev, cold_chain_ok: event.target.value }))}
            >
              <option value="true">Cold Chain: OK</option>
              <option value="false">Cold Chain: Alert</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating || !eligibleDonors.length}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 font-semibold text-on-primary disabled:opacity-70"
          >
            {creating ? "Recording..." : "Record Donation"}
          </button>
        </form>
      )}

      {canManageInventory && editingUnitId && (
        <form
          onSubmit={updateInventoryItem}
          className="rounded-2xl bg-surface p-5 shadow-ambient dark:border dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-on-surface dark:text-white">Update Inventory Item</h2>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface dark:bg-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              required
              type="text"
              value={editForm.unit_code}
              placeholder="Unit Code"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, unit_code: event.target.value }))}
            />

            <select
              required
              value={editForm.donor_id}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => syncBloodGroupFromDonor(event.target.value, setEditForm)}
            >
              <option value="">Select donor</option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donorLabel(donor)}
                </option>
              ))}
            </select>

            <select
              value={editForm.blood_group}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, blood_group: event.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={editForm.component}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, component: event.target.value }))}
            >
              {COMPONENT_OPTIONS.map((component) => (
                <option key={component} value={component}>
                  {formatLabel(component)}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              value={editForm.volume_ml}
              placeholder="Volume (ml)"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, volume_ml: event.target.value }))}
            />

            <input
              required
              type="text"
              value={editForm.storage_unit_id}
              placeholder="Storage Fridge"
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, storage_unit_id: event.target.value }))}
            />

            <input
              required
              type="date"
              value={editForm.expiry_date}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, expiry_date: event.target.value }))}
            />

            <select
              value={editForm.status}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={editForm.cold_chain_ok}
              className="rounded-md bg-surface-container-highest px-4 py-3 text-body-md dark:bg-gray-700 dark:text-gray-200"
              onChange={(event) => setEditForm((prev) => ({ ...prev, cold_chain_ok: event.target.value }))}
            >
              <option value="true">Cold Chain: OK</option>
              <option value="false">Cold Chain: Alert</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 font-semibold text-on-primary disabled:opacity-70"
          >
            {updating ? "Saving..." : "Save Inventory Changes"}
          </button>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={filters.blood_group}
          className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md dark:bg-gray-800 dark:text-gray-200"
          onChange={(event) => setFilters((prev) => ({ ...prev, blood_group: event.target.value }))}
        >
          <option value="">All Blood Groups</option>
          {(options.bloodGroups.length ? options.bloodGroups : BLOOD_GROUP_OPTIONS).map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          value={filters.component}
          className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md dark:bg-gray-800 dark:text-gray-200"
          onChange={(event) => setFilters((prev) => ({ ...prev, component: event.target.value }))}
        >
          <option value="">All Components</option>
          {(options.components.length ? options.components : COMPONENT_OPTIONS).map((component) => (
            <option key={component} value={component}>
              {formatLabel(component)}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          className="rounded-xl bg-surface-container-high px-4 py-3 text-body-md dark:bg-gray-800 dark:text-gray-200"
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="">All Statuses</option>
          {(options.statuses.length ? options.statuses : STATUS_OPTIONS).map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <BloodUnitTable units={units} canEdit={canManageInventory} onEdit={startEdit} onDelete={deleteInventoryItem} />
    </div>
  );
}
