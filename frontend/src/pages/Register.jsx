import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:5173/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful!");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to the server");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          

          <h1 className="text-3xl font-bold text-white">
            Expert Decision Replay
          </h1>

          <p className="text-slate-400 mt-2">
            Preserve decisions. Learn from outcomes.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Create your account
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              Join your organization's decision intelligence platform
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:border-transparent transition bg-white text-slate-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:border-transparent transition bg-white text-slate-900"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                focus:border-transparent transition bg-white text-slate-900"
              />

              <p className="text-xs text-slate-400 mt-2">
                Use at least 6 characters
              </p>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 text-white
              font-semibold hover:bg-indigo-700 active:scale-[0.98]
              transition-all duration-200 shadow-lg shadow-indigo-600/20"
            >
              Create Account
            </button>

          </form>

          {/* Message */}
          {message && (
            <div
              className={`mt-5 p-3 rounded-lg text-sm text-center ${
                message.includes("successful")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Expert Decision Replay Platform
        </p>

      </div>
    </div>
  );
}

export default Register;