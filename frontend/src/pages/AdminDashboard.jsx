import { useEffect, useState } from "react";

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
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
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Change user role
  const changeRole = async (id, currentRole) => {
    const newRole =
      currentRole === "Employee" ? "Manager" : "Employee";

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${id}/role`,
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

      alert("Role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${id}`,
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

      alert("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <h2>Welcome {user?.name}</h2>

      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>

      <hr />

      <h2>Administrator Panel</h2>
      <p>Manage registered users below.</p>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>

                <td>
                  {item._id !== user?._id && (
                    <>
                      <button
                        onClick={() =>
                          changeRole(item._id, item.role)
                        }
                      >
                        Change Role
                      </button>

                      <button
                        onClick={() => deleteUser(item._id)}
                        style={{ marginLeft: "10px" }}
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {item._id === user?._id && <span> Current User</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;