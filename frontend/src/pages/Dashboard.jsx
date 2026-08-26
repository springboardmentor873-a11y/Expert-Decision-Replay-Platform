function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>Welcome {user?.name}</h2>

      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;