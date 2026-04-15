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
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function toTitleCaseWithSpaces(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BloodUnits() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [filters, setFilters] = useState({ blood_group: "", status: "", component: "" });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [form, setForm] = useState({
    unit_code: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    component: COMPONENT_OPTIONS[0],
    volume_ml: 350,
    expiry_date: "",
    status: "available",
    cold_chain_ok: "true"
  });
  const [editForm, setEditForm] = useState({
    unit_code: "",
    blood_group: BLOOD_GROUP_OPTIONS[0],
    component: COMPONENT_OPTIONS[0],
    volume_ml: 350,
    expiry_date: "",
    status: "available",
    cold_chain_ok: "true"
  });

  const canCreateInventory = user?.role === "lab_technician" || user?.role === "admin";
  const canEditInventory = user?.role === "lab_technician" || user?.role === "admin";

  const loadFiltered = async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const { data } = await api.get("/blood-units", { params });
    setUnits(data);
  };

  const loadAllCategories = async () => {
    const { data } = await api.get("/blood-units");
    setAllUnits(data);
  };

  const options = useMemo(() => {
    const unique = (key) => [...new Set(allUnits.map((u) => u[key]).filter(Boolean))].sort();
    return {
      bloodGroups: unique("blood_group"),
      statuses: unique("status"),
      components: unique("component")
    };
  }, [allUnits]);

  const formatComponent = (value) =>
    value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  useEffect(() => {
    loadAllCategories();
  }, []);

  useEffect(() => {
    loadFiltered();
  }, [filters.blood_group, filters.status, filters.component]);

  const createInventoryItem = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        unit_code: form.unit_code.trim(),
        blood_group: form.blood_group,
        component: form.component,
        volume_ml: Number(form.volume_ml),
        expiry_date: form.expiry_date,
        status: form.status,
        cold_chain_ok: form.cold_chain_ok === "true"
      };
      await api.post("/blood-units", payload);
      toast.success("Inventory item added");
      setForm((prev) => ({
        ...prev,
        unit_code: "",
        volume_ml: 350,
        expiry_date: "",
        status: "available",
        cold_chain_ok: "true"
      }));
      await Promise.all([loadFiltered(), loadAllCategories()]);
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
      blood_group: unit.blood_group,
      component: unit.component,
      volume_ml: unit.volume_ml,
      expiry_date: toDateInputValue(unit.expiry_date),
      status: unit.status,
      cold_chain_ok: unit.cold_chain_ok ? "true" : "false"
    });
  };

  const cancelEdit = () => {
    setEditingUnitId(null);
  };

  const updateInventoryItem = async (e) => {
    e.preventDefault();
    if (!editingUnitId) {
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        unit_code: editForm.unit_code.trim(),
        blood_group: editForm.blood_group,
        component: editForm.component,
        volume_ml: Number(editForm.volume_ml),
        expiry_date: editForm.expiry_date,
        status: editForm.status,
        cold_chain_ok: editForm.cold_chain_ok === "true"
      };
      await api.put(`/blood-units/${editingUnitId}`, payload);
      toast.success("Inventory item updated");
      setEditingUnitId(null);
      await Promise.all([loadFiltered(), loadAllCategories()]);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update inventory item");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Inventory</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Manage your blood unit inventory</p>
      </div>

      {canCreateInventory && (
        <form
          onSubmit={createInventoryItem}
          className="rounded-lg bg-surface dark:bg-gray-800 p-5 shadow-ambient dark:shadow-none dark:border dark:border-gray-700"
        >
          <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Add Inventory Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              required
              type="text"
              value={form.unit_code}
              placeholder="Unit Code"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, unit_code: e.target.value }))}
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

            <select
              value={form.component}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, component: e.target.value }))}
            >
              {COMPONENT_OPTIONS.map((component) => (
                <option key={component} value={component}>
                  {toTitleCaseWithSpaces(component)}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              value={form.volume_ml}
              placeholder="Volume (ml)"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, volume_ml: e.target.value }))}
            />

            <input
              required
              type="date"
              value={form.expiry_date}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
            />

            <select
              value={form.status}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {toTitleCaseWithSpaces(status)}
                </option>
              ))}
            </select>

            <select
              value={form.cold_chain_ok}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setForm((prev) => ({ ...prev, cold_chain_ok: e.target.value }))}
            >
              <option value="true">Cold Chain: OK</option>
              <option value="false">Cold Chain: Alert</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 font-semibold disabled:opacity-70"
          >
            {creating ? "Adding..." : "Add Item"}
          </button>
        </form>
      )}

      {canEditInventory && editingUnitId && (
        <form
          onSubmit={updateInventoryItem}
          className="rounded-lg bg-surface dark:bg-gray-800 p-5 shadow-ambient dark:shadow-none dark:border dark:border-gray-700"
        >
          <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Update Inventory Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              required
              type="text"
              value={editForm.unit_code}
              placeholder="Unit Code"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, unit_code: e.target.value }))}
            />

            <select
              value={editForm.blood_group}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, blood_group: e.target.value }))}
            >
              {BLOOD_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={editForm.component}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, component: e.target.value }))}
            >
              {COMPONENT_OPTIONS.map((component) => (
                <option key={component} value={component}>
                  {toTitleCaseWithSpaces(component)}
                </option>
              ))}
            </select>

            <input
              required
              type="number"
              min="1"
              value={editForm.volume_ml}
              placeholder="Volume (ml)"
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, volume_ml: e.target.value }))}
            />

            <input
              required
              type="date"
              value={editForm.expiry_date}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
            />

            <select
              value={editForm.status}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {toTitleCaseWithSpaces(status)}
                </option>
              ))}
            </select>

            <select
              value={editForm.cold_chain_ok}
              className="rounded-md bg-surface-container-highest dark:bg-gray-700 dark:text-gray-200 px-4 py-3 text-body-md"
              onChange={(e) => setEditForm((prev) => ({ ...prev, cold_chain_ok: e.target.value }))}
            >
              <option value="true">Cold Chain: OK</option>
              <option value="false">Cold Chain: Alert</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={updating}
              className="rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 font-semibold disabled:opacity-70"
            >
              {updating ? "Updating..." : "Update Item"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-surface-container-high dark:bg-gray-700 text-on-surface dark:text-gray-200 px-5 py-2.5 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select
          value={filters.blood_group}
          className="w-full rounded-md bg-surface-container-highest dark:bg-gray-800 dark:text-gray-200 px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setFilters((f) => ({ ...f, blood_group: e.target.value }))}
        >
          <option value="">All Blood Groups</option>
          {options.bloodGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          className="w-full rounded-md bg-surface-container-highest dark:bg-gray-800 dark:text-gray-200 px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.component}
          className="w-full rounded-md bg-surface-container-highest dark:bg-gray-800 dark:text-gray-200 px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setFilters((f) => ({ ...f, component: e.target.value }))}
        >
          <option value="">All Components</option>
          {options.components.map((component) => (
            <option key={component} value={component}>
              {formatComponent(component)}
            </option>
          ))}
        </select>
      </div>
      
      <BloodUnitTable units={units} canEdit={canEditInventory} onEdit={startEdit} />
    </div>
  );
}
