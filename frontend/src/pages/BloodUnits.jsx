import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import BloodUnitTable from "../components/BloodUnitTable";

export default function BloodUnits() {
  const [units, setUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [filters, setFilters] = useState({ blood_group: "", status: "", component: "" });

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

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Inventory</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Manage your blood unit inventory</p>
      </div>

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
      
      <BloodUnitTable units={units} />
    </div>
  );
}
