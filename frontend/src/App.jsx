import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { ToastProvider } from "./ToastContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DecisionsList from "./pages/DecisionsList.jsx";
import DecisionDetail from "./pages/DecisionDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Teams from "./pages/Teams.jsx";
import Admin from "./pages/Admin.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Repository from "./pages/Repository.jsx";
import Discussions from "./pages/Discussions.jsx";
import Notifications from "./pages/Notifications.jsx";
import Reports from "./pages/Reports.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

function RequireAuth() {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== "administrator") return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireManagerOrAdmin() {
  const { user } = useAuth();
  if (!["manager", "administrator"].includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Sidebar and Header live here, ONE level above every page route, so React
// keeps this same instance mounted across navigation — only the <Outlet/>
// content underneath swaps. Previously every route wrapped its own fresh
// <AppShell><Sidebar/>...</AppShell>, which fully unmounted and remounted
// the sidebar (resetting its notification poll, losing hover/focus state,
// visibly flashing) on every single navigation.
function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repository" element={<Repository />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/decisions" element={<DecisionsList />} />
            <Route path="/decisions/:id" element={<DecisionDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/team-decisions" element={<DecisionsList scope="team" />} />
            <Route path="/search" element={<DecisionsList />} />

            <Route element={<RequireManagerOrAdmin />}>
              <Route path="/reports" element={<Reports />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}
