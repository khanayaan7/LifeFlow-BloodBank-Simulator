import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Package, Hospital, FileText, AlertTriangle, Thermometer, FileCheck, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

const ICON_MAP = {
  Dashboard: LayoutDashboard,
  Donors: Users,
  "Blood Units": Package,
  Inventory: Package,
  Hospitals: Hospital,
  "Blood Requests": FileText,
  Requests: FileText,
  Violations: AlertTriangle,
  "Temperature Logs": Thermometer,
  "Audit Log": FileCheck
};

const NAV_BY_ROLE = {
  admin: [
    { path: "/", label: "Dashboard" },
    { path: "/donors", label: "Donors" },
    { path: "/blood-units", label: "Inventory" },
    { path: "/hospitals", label: "Hospitals" },
    { path: "/requests", label: "Requests" },
    { path: "/violations", label: "Violations" },
    { path: "/temperature", label: "Temperature Logs" },
    { path: "/audit", label: "Audit Log" }
  ],
  hospital_staff: [
    { path: "/", label: "Dashboard" },
    { path: "/requests", label: "Requests" },
    { path: "/blood-units", label: "Inventory" },
    { path: "/hospitals", label: "Hospitals" }
  ],
  lab_technician: [
    { path: "/", label: "Dashboard" },
    { path: "/blood-units", label: "Inventory" },
    { path: "/donors", label: "Donors" },
    { path: "/temperature", label: "Temperature Logs" },
    { path: "/violations", label: "Violations" }
  ],
  auditor: [
    { path: "/", label: "Dashboard" },
    { path: "/audit", label: "Audit Log" },
    { path: "/violations", label: "Violations" }
  ]
};

export default function Sidebar({ role }) {
  const { isMinimized, toggleMinimize } = useSidebar();
  const nav = NAV_BY_ROLE[role] || [];

  return (
    <aside className={`min-h-[calc(100vh-57px)] border-r border-surface-container-low dark:border-gray-700 bg-surface dark:bg-gray-900 flex flex-col transition-all duration-300 ${isMinimized ? "w-20" : "w-64"}`}>
      {/* Minimize Button */}
      <div className="flex items-center justify-center p-4">
        <button
          onClick={toggleMinimize}
          className="p-2 rounded-lg hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors text-on-surface-variant dark:text-gray-400 hover:text-on-surface dark:hover:text-gray-300"
          title={isMinimized ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMinimized ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-2">
        {nav.map(({ path, label }) => {
          const Icon = ICON_MAP[label] || Package;
          return (
            <NavLink
              key={path}
              to={path}
              title={isMinimized ? label : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-body-md transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary-container text-on-primary font-medium dark:from-red-600 dark:to-red-700"
                    : "text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-800"
                } ${isMinimized ? "justify-center" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isMinimized && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
