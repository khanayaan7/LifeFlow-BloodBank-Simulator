import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Thermometer } from "lucide-react";

import api from "../api/axios";

export default function TemperatureLogs() {
  const [units, setUnits] = useState([]);
  const [selected, setSelected] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/temperature/storage-units").then((res) => {
      setUnits(res.data);
      if (res.data.length) setSelected(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/temperature/history/${selected}`, { params: { hours: 24, limit: 100 } }).then((res) => setLogs(res.data));
  }, [selected]);

  const chartData = logs
    .slice()
    .reverse()
    .map((log) => ({ t: new Date(log.recorded_at).toLocaleTimeString(), temp: log.temperature_c }));

  const getTempStatus = (temp) => {
    if (temp >= 2 && temp <= 6) return "safe";
    return "warning";
  };

  return (
    <div className="space-y-6 p-6 dark:bg-gray-950">
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface dark:text-white">Temperature Logs</h1>
        <p className="mt-1 text-body-md text-on-surface-variant dark:text-gray-400">Monitor storage unit temperature history</p>
      </div>

      {/* Storage Unit Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-label-md font-semibold text-on-surface dark:text-gray-300 mb-2">Storage Unit</label>
          <select 
            className="w-full rounded-md bg-surface-container-highest dark:bg-gray-800 dark:text-gray-200 px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            value={selected} 
            onChange={(e) => setSelected(e.target.value)}
          >
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 p-6">
        <h2 className="font-display text-xl font-bold text-on-surface dark:text-white mb-4">Temperature Trend</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4f4f4f" />
              <XAxis dataKey="t" stroke="#999999" />
              <YAxis domain={[0, 14]} stroke="#999999" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px"
                }}
                labelStyle={{ color: "#111827" }}
                itemStyle={{ color: "#111827" }}
              />
              <ReferenceLine y={2} stroke="#af101a" strokeDasharray="4 4" label={{ value: "Min (2°C)", position: "right", fill: "#af101a" }} />
              <ReferenceLine y={6} stroke="#af101a" strokeDasharray="4 4" label={{ value: "Max (6°C)", position: "right", fill: "#af101a" }} />
              <Line type="monotone" dataKey="temp" stroke="#af101a" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg bg-surface dark:bg-gray-800 shadow-ambient dark:shadow-none dark:border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md">
            <thead className="bg-surface-container-low dark:bg-gray-700 border-b border-surface-container-high dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Time</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Temperature</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface-variant dark:text-gray-300">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <p className="text-body-md text-on-surface-variant dark:text-gray-400">No temperature logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-3 font-medium text-on-surface dark:text-gray-200">{new Date(log.recorded_at).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-on-surface dark:text-gray-200">{log.temperature_c}°C</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-label-md font-semibold ${getTempStatus(log.temperature_c) === "safe" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                        {getTempStatus(log.temperature_c) === "safe" ? "✓ Safe" : "✗ Warning"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant dark:text-gray-400">{log.source || "—"}</td>
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
