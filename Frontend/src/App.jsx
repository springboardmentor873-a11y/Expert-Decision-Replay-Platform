import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DecisionForm from "./pages/DecisionForm";
import DecisionDetail from "./pages/DecisionDetail";
import ModulePage from "./pages/ModulePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Decisions */}
        <Route path="/decisions" element={<Dashboard />} />
        <Route path="/decisions/new" element={<DecisionForm />} />
        <Route path="/decisions/:id" element={<DecisionDetail />} />

        {/* Modules */}
        <Route path="/teams/*" element={<ModulePage />} />
        <Route path="/discussions/*" element={<ModulePage />} />
        <Route path="/documents/*" element={<ModulePage />} />
        <Route path="/analytics/*" element={<ModulePage />} />
        <Route path="/profile/*" element={<ModulePage />} />
        <Route path="/settings/*" element={<ModulePage />} />
        {/* Unknown page */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;