import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

import api from "../api/axios";
import StatCard from "../components/StatCard";
import TemperatureChart from "../components/TemperatureChart";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendLines, setTrendLines] = useState([]);
  const [activity, setActivity] = useState([]);

  const load = async () => {
    const [statsRes, activityRes] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/recent-activity")
    ]);
    setStats(statsRes.data);
    setActivity(activityRes.data);
  };

  const loadTrend = async () => {
    const hours = 24 * 7;
    const unitsRes = await api.get("/temperature/storage-units");
    const units = unitsRes.data || [];

    if (units.length === 0) {
      setTrendData([]);
      setTrendLines([]);
      return;
    }

    const histories = await Promise.all(
      units.map(async (unit) => {
        const res = await api.get(`/temperature/history/${unit}?hours=${hours}&limit=5000`);
        return { unit, logs: res.data || [] };
      })
    );

    const bucketMap = new Map();
    histories.forEach(({ unit, logs }) => {
      const unitBucket = new Map();
      logs.forEach((log) => {
        const dayKey = new Date(log.recorded_at).toISOString().slice(0, 10);
        const prev = unitBucket.get(dayKey) || { sum: 0, count: 0 };
        unitBucket.set(dayKey, { sum: prev.sum + log.temperature_c, count: prev.count + 1 });
      });

      unitBucket.forEach((value, dayKey) => {
        if (!bucketMap.has(dayKey)) {
          bucketMap.set(dayKey, { time: dayKey });
        }
        bucketMap.get(dayKey)[unit] = Number((value.sum / value.count).toFixed(2));
      });
    });

    const sorted = Array.from(bucketMap.keys()).sort();
    const formattedData = sorted.map((dayKey) => {
      const day = new Date(`${dayKey}T00:00:00`);
      return {
        ...bucketMap.get(dayKey),
        time: day.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      };
    });

    setTrendLines(units);
    setTrendData(formattedData);
  };

  useEffect(() => {
    load();
    loadTrend();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-96 text-on-surface-variant">Loading dashboard...</div>;

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Blood Bank Control</h1>
          <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Real-time vital stats and inventory health overview.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high dark:bg-gray-800">
          <Calendar className="h-5 w-5 text-on-surface-variant dark:text-gray-500" />
          <span className="text-body-md text-on-surface dark:text-gray-200">Oct 24, 2026 - Today</span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard title="Total Units" value={stats.total_units} />
        <StatCard title="Available Units" value={stats.available_units} />
        <StatCard title="Expiring Soon" value={stats.expiring_soon} />
        <StatCard title="Active Violations" value={stats.active_violations} />
        <StatCard title="Pending Requests" value={stats.pending_requests} />
      </div>

      {/* Chart & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Chart */}
        <div className="rounded-lg bg-surface dark:bg-gray-800 p-6 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 lg:col-span-3">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-on-surface dark:text-white">Blood Supply Trend</h2>
            <p className="text-body-md text-on-surface-variant dark:text-gray-400">Average temperature trend by storage unit</p>
          </div>
          <TemperatureChart data={trendData} lines={trendLines} />
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-surface dark:bg-gray-800 p-6 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-on-surface dark:text-white">Recent Activity</h2>
            <a href="/audit" className="text-label-md font-semibold text-primary hover:text-primary-fixed transition-colors">
              View All
            </a>
          </div>
          <div className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-body-md text-on-surface-variant dark:text-gray-400">No recent activity</p>
            ) : (
              activity.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 pb-4 border-b border-surface-container-low dark:border-gray-700 last:border-b-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-error/20 dark:bg-error/30 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface dark:text-white truncate">{a.action}</p>
                    <p className="text-label-md text-on-surface-variant dark:text-gray-400">{a.entity_type} - {a.entity_id}</p>
                    <p className="text-label-md text-on-surface-variant dark:text-gray-400 mt-1">12m ago</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inventory by Blood Group */}
      <div className="rounded-lg bg-surface dark:bg-gray-800 p-6 shadow-ambient dark:shadow-none dark:border dark:border-gray-700">
        <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Inventory by Blood Group</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["O+", "A+", "B+", "AB+"].map((group) => (
            <div key={group} className="bg-surface-container-low dark:bg-gray-700 rounded-lg p-4">
              <p className="text-label-md font-medium text-on-surface-variant dark:text-gray-400 uppercase mb-2">{group}</p>
              <p className="text-2xl font-bold text-on-surface dark:text-white">248</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-surface-container-high dark:bg-gray-600 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary-container" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
