import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateDecision from "./pages/CreateDecision";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Decisions from "./pages/Decisions";
import DecisionDetails from "./pages/DecisionDetails";
import Profile from "./pages/Profile";
import Replay from "./pages/Replay";
import Approvals from "./pages/Approvals";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Teams from "./pages/Teams";
import KnowledgeRepository from "./pages/KnowledgeRepository";
import Discussions from "./pages/Discussions";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/"
          element={<Login />}
        />


        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* Decisions */}
        <Route
          path="/decisions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Decisions />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* Decision Details */}
        <Route
          path="/decisions/:decisionId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DecisionDetails />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
  path="/decisions/create"
  element={
    <ProtectedRoute>
      <AppLayout>
        <CreateDecision />
      </AppLayout>
    </ProtectedRoute>
  }
/>


        {/* Replay */}
        <Route
          path="/decisions/:decisionId/replay"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Replay />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

                {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

        <Route
  path="/approvals"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Approvals />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Notifications />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/reports"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Reports />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/teams"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Teams />
      </AppLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/knowledge"
  element={
    <ProtectedRoute>
      <AppLayout>
        <KnowledgeRepository />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/discussions"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Discussions />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/documents"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Documents />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Analytics />
      </AppLayout>
    </ProtectedRoute>
  }
/>

      </Routes>

    </BrowserRouter>
  );
}

export default App;