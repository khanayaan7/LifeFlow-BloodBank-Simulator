import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";
import { useSidebar } from "./context/SidebarContext";
import AuditLog from "./pages/AuditLog";
import BloodRequests from "./pages/BloodRequests";
import BloodUnits from "./pages/BloodUnits";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import Hospitals from "./pages/Hospitals";
import Login from "./pages/Login";
import TemperatureLogs from "./pages/TemperatureLogs";
import Violations from "./pages/Violations";

function Shell({ children }) {
  const { user } = useAuth();
  const { isMinimized } = useSidebar();
  return (
    <div className="bg-appbg dark:bg-gray-950">
      <Navbar />
      <div className="flex min-h-[calc(100vh-60px)]">
        <Sidebar role={user?.role} />
        <main className={`flex-1 bg-appbg dark:bg-gray-950 transition-all duration-300`}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell>
              <Dashboard />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donors"
        element={
          <ProtectedRoute roles={["admin", "lab_technician"]}>
            <Shell>
              <Donors />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blood-units"
        element={
          <ProtectedRoute roles={["admin", "lab_technician", "hospital_staff"]}>
            <Shell>
              <BloodUnits />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospitals"
        element={
          <ProtectedRoute roles={["admin", "hospital_staff"]}>
            <Shell>
              <Hospitals />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute roles={["admin", "hospital_staff"]}>
            <Shell>
              <BloodRequests />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/violations"
        element={
          <ProtectedRoute roles={["admin", "lab_technician", "auditor"]}>
            <Shell>
              <Violations />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/temperature"
        element={
          <ProtectedRoute roles={["admin", "lab_technician"]}>
            <Shell>
              <TemperatureLogs />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute roles={["admin", "auditor"]}>
            <Shell>
              <AuditLog />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
