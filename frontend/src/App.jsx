import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { ToastProvider } from "./ToastContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DecisionsList from "./pages/DecisionsList.jsx";
import CreateDecision from "./pages/CreateDecision.jsx";
import MyDiscussions from "./pages/MyDiscussions.jsx";
import Documents from "./pages/Documents.jsx";
import Analytics from "./pages/Analytics.jsx";
import DecisionDetail from "./pages/DecisionDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Teams from "./pages/Teams.jsx";
import Settings from "./pages/Settings.jsx";
import Admin from "./pages/Admin.jsx";

function RequireAuth({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== "administrator") return <Navigate to="/" replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell>
                <Dashboard />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/decisions"
          element={
            <RequireAuth>
              <AppShell>
                <DecisionsList />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/create-decision"
          element={
            <RequireAuth>
              <AppShell>
                <CreateDecision />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/my-discussions"
          element={
            <RequireAuth>
              <AppShell>
                <MyDiscussions />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/documents"
          element={
            <RequireAuth>
              <AppShell>
                <Documents />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <AppShell>
                <Analytics />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/decisions/:id"
          element={
            <RequireAuth>
              <AppShell>
                <DecisionDetail />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <AppShell>
                <Profile />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireAuth>
              <AppShell>
                <Teams />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <AppShell>
                <Settings />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AppShell>
                  <Admin />
                </AppShell>
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
