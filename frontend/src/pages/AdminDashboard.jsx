import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

const API_URL = "http://localhost:5173";

  // Get all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
  }, []);

  // Change user role
  const changeRole = async (id, newRole) => {
    try {
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/users/${id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }

      setMessage("Role updated successfully!");

      await fetchUsers();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to update role");
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      setMessage("User deleted successfully!");

      await fetchUsers();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to delete user");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // Statistics
  const totalUsers = users.length;

  const employees = users.filter(
    (item) => item.role === "Employee"
  ).length;

  const managers = users.filter(
    (item) => item.role === "Manager"
  ).length;

  const reviewers = users.filter(
    (item) => item.role === "Reviewer"
  ).length;

  const administrators = users.filter(
    (item) => item.role === "Administrator"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* SIDEBAR */}
      <aside className="w-64 min-h-screen bg-slate-900 text-white p-5 flex flex-col">

        {/* LOGO */}
        <div className="mb-10">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">
              🧠
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Decision Replay
              </h2>

              <p className="text-xs text-slate-400">
                Admin Portal
              </p>
            </div>

          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-2">

          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-left font-medium"
          >
            📊 Dashboard
          </button>

          <button
            onClick={() =>
              document
                .getElementById("user-management")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
          >
            👥 User Management
          </button>

          <button
            onClick={() =>
              document
                .getElementById("roles-access")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
          >
            🛡️ Roles & Access
          </button>

          <button
            onClick={fetchUsers}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition text-left"
          >
            ⚙️ Refresh Data
          </button>

        </nav>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mt-auto w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-500 transition text-left"
        >
          🚪 Logout
        </button>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-auto">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="text-slate-500 mt-1">
              Manage users, roles and platform access.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm">

            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                {user?.name || "Administrator"}
              </p>

              <p className="text-xs text-slate-500">
                {user?.role || "Administrator"}
              </p>
            </div>

          </div>

        </header>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border ${
              message.toLowerCase().includes("successfully")
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* STATISTICS */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          {/* TOTAL USERS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <p className="text-sm text-slate-500">
              Total Users
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              {totalUsers}
            </h2>

            <p className="text-xs text-indigo-600 mt-2">
              Registered platform users
            </p>

          </div>

          {/* EMPLOYEES */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <p className="text-sm text-slate-500">
              Employees
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              {employees}
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              Active employee accounts
            </p>

          </div>

          {/* MANAGERS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <p className="text-sm text-slate-500">
              Managers
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              {managers}
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              Management accounts
            </p>

          </div>

          {/* REVIEWERS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <p className="text-sm text-slate-500">
              Reviewers
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              {reviewers}
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              Decision review accounts
            </p>

          </div>

        </section>

        {/* USER MANAGEMENT */}
        <section
          id="user-management"
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >

          {/* SECTION HEADER */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                User Management
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                View and manage registered users and their roles.
              </p>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>

          </div>

          {/* LOADING */}
          {loading ? (

            <div className="p-10 text-center text-slate-500">
              Loading users...
            </div>

          ) : users.length === 0 ? (

            <div className="p-10 text-center text-slate-500">
              No users found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                {/* TABLE HEADER */}
                <thead className="bg-slate-50 border-b border-slate-100">

                  <tr>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                      User
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                      Email
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                      Role
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                      Actions
                    </th>

                  </tr>

                </thead>

                {/* TABLE BODY */}
                <tbody>

                  {users.map((item) => (

                    <tr
                      key={item._id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >

                      {/* USER */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">

                            {item.name?.charAt(0)?.toUpperCase() || "U"}

                          </div>

                          <span className="font-medium text-slate-800">
                            {item.name}
                          </span>

                        </div>

                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.email}
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-4">

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">

                          {item.role}

                        </span>

                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">

                        {item._id !== user?._id ? (

                          <div className="flex gap-2 items-center">

                            {/* CHANGE ROLE */}
                            <select
                              value={item.role}
                              onChange={(e) =>
                                changeRole(
                                  item._id,
                                  e.target.value
                                )
                              }
                              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >

                              <option value="Employee">
                                Employee
                              </option>

                              <option value="Reviewer">
                                Reviewer
                              </option>

                              <option value="Manager">
                                Manager
                              </option>

                              <option value="Administrator">
                                Administrator
                              </option>

                            </select>

                            {/* DELETE */}
                            <button
                              onClick={() =>
                                deleteUser(item._id)
                              }
                              className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            >
                              Delete
                            </button>

                          </div>

                        ) : (

                          <span className="text-sm text-slate-400">
                            Current User
                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ROLES & ACCESS */}
        <section
          id="roles-access"
          className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >

          <h2 className="text-xl font-bold text-slate-900">
            Roles & Access
          </h2>

          <p className="text-sm text-slate-500 mt-1 mb-5">
            Overview of the available roles in the platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-slate-800">
                Employee
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Creates and submits decisions for review.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-slate-800">
                Reviewer
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Reviews submitted decisions and adds feedback.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-slate-800">
                Manager
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Makes the final approval or rejection decision.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-slate-800">
                Administrator
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Manages users, roles and platform access.
              </p>
            </div>

          </div>

          <div className="mt-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100">

            <p className="text-sm text-indigo-700">
              Administrator accounts:{" "}
              <strong>{administrators}</strong>
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;