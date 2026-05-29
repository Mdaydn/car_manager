import { Navigate, Route, Routes, NavLink, useNavigate } from "react-router-dom";
import Car from "./car";
import Service from "./service";
import ServiceRecord from "./ServiceRecord.";
import Payment from "./payment";
import Signin from "./logn";
import ProtectedRoute from "./components/ProtectedRoute";
import MonthlyReport from "./pages/admin/MonthlyReport";
import WeeklyReport from "./pages/admin/WeeklyReport";
import AllReports from "./pages/admin/AllReports";
import Invoice from "./pages/admin/Invoice";
import { clearStoredUser, getDefaultPath, getStoredUser, resolveRole } from "./auth";

const userNav = [
  { to: "/car", label: "Car" },
  { to: "/service", label: "Service" },
  { to: "/ServiceRecord", label: "Service Record" },
  { to: "/Payment", label: "Payment" },
];

const adminNav = [
  { to: "/admin/monthly-report", label: "Monthly Report" },
  { to: "/admin/weekly-report", label: "Weekly Report" },
  { to: "/admin/all-reports", label: "All Reports" },
  { to: "/admin/invoice", label: "Invoice" },
];

function App() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = resolveRole(user);
  const navItems = role === "admin" ? adminNav : role === "user" ? userNav : [];

  const handleLogout = () => {
    clearStoredUser();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {user ? (
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">Garage Management</p>
              <p className="text-sm text-slate-500">
                {role === "admin" ? "Admin — reports & invoices" : "User — cars & services"}
                {user.name ? ` · ${user.name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <main className={`mx-auto w-full max-w-6xl px-4 py-6 ${user ? "" : "flex min-h-screen items-center justify-center"}`}>
        <div className={`w-full ${user ? "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6" : "max-w-md"}`}>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={getDefaultPath(user)} replace />
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />
            <Route
              path="/signin"
              element={user ? <Navigate to={getDefaultPath(user)} replace /> : <Signin />}
            />

            <Route
              path="/car"
              element={
                <ProtectedRoute allowedRole="user">
                  <Car />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service"
              element={
                <ProtectedRoute allowedRole="user">
                  <Service />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ServiceRecord"
              element={
                <ProtectedRoute allowedRole="user">
                  <ServiceRecord />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Payment"
              element={
                <ProtectedRoute allowedRole="user">
                  <Payment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/monthly-report"
              element={
                <ProtectedRoute allowedRole="admin">
                  <MonthlyReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/weekly-report"
              element={
                <ProtectedRoute allowedRole="admin">
                  <WeeklyReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/all-reports"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AllReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoice"
              element={
                <ProtectedRoute allowedRole="admin">
                  <Invoice />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
