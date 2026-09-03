import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Decisions from "../pages/Decisions/Decisions";
import CreateDecision from "../pages/CreateDecision/CreateDecision";
import DecisionDetails from "../pages/DecisionDetails/DecisionDetails";
import RequireAuth from "./RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions"
        element={
          <RequireAuth>
            <Decisions />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions/new"
        element={
          <RequireAuth>
            <CreateDecision />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions/:decisionId"
        element={
          <RequireAuth>
            <DecisionDetails />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
