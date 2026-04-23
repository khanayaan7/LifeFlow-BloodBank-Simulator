import { LogOut, Moon, Sun, Shield, Building2, Beaker, CheckSquare, HeartHandshake } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import RoleBadge from "./RoleBadge";

const ROLE_ICONS = {
  admin: { Icon: Shield, color: "text-red-500", label: "Admin" },
  hospital_staff: { Icon: Building2, color: "text-blue-500", label: "Hospital Staff" },
  lab_technician: { Icon: Beaker, color: "text-purple-500", label: "Lab Technician" },
  auditor: { Icon: CheckSquare, color: "text-green-500", label: "Auditor" },
  donor: { Icon: HeartHandshake, color: "text-rose-500", label: "Donor" }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const roleConfig = ROLE_ICONS[user?.role] || { Icon: Shield, color: "text-gray-500", label: "User" };
  const { Icon, color, label } = roleConfig;

  return (
    <header className="border-b border-surface-container-low dark:border-gray-700 bg-surface dark:bg-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-on-surface dark:text-white">LifeFlow</h1>
            <p className="text-label-md text-on-surface-variant dark:text-gray-400">VITAL MANAGEMENT</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Theme Toggle, User & Logout */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg bg-surface-container-high dark:bg-gray-700 hover:bg-surface-container-low dark:hover:bg-gray-600 transition-colors text-on-surface-variant dark:text-gray-400"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Role Icon */}
          <div 
            className="h-10 w-10 rounded-lg bg-surface-container-high dark:bg-gray-700 flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-gray-600 transition-colors"
            title={label}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>

          <div className="text-right">
            <p className="text-body-md font-semibold text-on-surface dark:text-white">{user?.full_name?.split(" ")[0] || "User"}</p>
            <p className="text-label-md text-on-surface-variant dark:text-gray-400">
              <RoleBadge role={user?.role} />
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-2 rounded-lg bg-surface-container-high dark:bg-gray-700 p-2 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-highest dark:hover:bg-gray-600 hover:text-on-surface dark:hover:text-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
