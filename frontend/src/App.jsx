import { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

function App() {
  const [page, setPage] = useState("login");

  if (page === "login") {
    return (
      <Login
        onRegister={() => setPage("register")}
        onLogin={() => setPage("dashboard")}
      />
    );
  }

  if (page === "register") {
    return <Register onLogin={() => setPage("login")} />;
  }

  if (page === "dashboard") {
    return <Dashboard />;
  }
}

export default App;
