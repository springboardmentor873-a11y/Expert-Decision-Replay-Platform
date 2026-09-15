
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5173/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("Login successful!");

        setTimeout(() => {
          if (data.user.role === "Employee") {
            navigate("/employee");
          } else if (data.user.role === "Reviewer") {
            navigate("/reviewer");
          } else if (data.user.role === "Manager") {
            navigate("/manager");
          } else if (data.user.role === "Administrator") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 500);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Unable to connect to server");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-6xl">

        {/* Main Login Container */}
        <div className="grid lg:grid-cols-2 bg-white/95 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">

          {/* =====================================================
              LEFT SIDE - BRAND / INFORMATION
          ===================================================== */}
          <div className="hidden lg:flex relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-12 flex-col justify-between overflow-hidden">

            {/* Decorative circles */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full" />
            <div className="absolute -bottom-32 -left-24 w-80 h-80 bg-blue-500/10 rounded-full" />

            <div className="relative z-10">

              {/* Brand */}
              <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
                  ↺
                </div>

                <div>
                  <h1 className="text-xl font-bold">
                    Expert Decision Replay
                  </h1>

                  <p className="text-indigo-200 text-xs mt-1">
                    Decision intelligence platform
                  </p>
                </div>
              </div>

              {/* Main Message */}
              <div className="max-w-md">

                <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-4">
                  Learn from every decision
                </p>

                <h2 className="text-4xl font-bold leading-tight mb-5">
                  Every decision tells a story.
                </h2>

                <p className="text-slate-300 leading-relaxed">
                  Replay important decisions, understand how they were made,
                  review outcomes, and turn experience into better decisions.
                </p>

              </div>

              {/* Decision Flow */}
              <div className="mt-10 space-y-3">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    01
                  </div>

                  <div>
                    <p className="font-semibold text-sm">
                      Create Decision
                    </p>
                    <p className="text-xs text-slate-400">
                      Capture the decision and supporting documents
                    </p>
                  </div>
                </div>

                <div className="ml-5 h-5 border-l border-dashed border-indigo-400/50" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    02
                  </div>

                  <div>
                    <p className="font-semibold text-sm">
                      Review & Evaluate
                    </p>
                    <p className="text-xs text-slate-400">
                      Collaborate and provide expert feedback
                    </p>
                  </div>
                </div>

                <div className="ml-5 h-5 border-l border-dashed border-indigo-400/50" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    03
                  </div>

                  <div>
                    <p className="font-semibold text-sm">
                      Replay & Learn
                    </p>
                    <p className="text-xs text-slate-400">
                      Understand outcomes and improve future decisions
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom quote */}
            <div className="relative z-10 mt-10 pt-6 border-t border-white/10">
              <p className="text-sm text-slate-400 italic">
                "Better decisions begin with understanding the decisions
                we've already made."
              </p>
            </div>

          </div>

          {/* =====================================================
              RIGHT SIDE - LOGIN FORM
          ===================================================== */}
          <div className="p-8 sm:p-10 lg:p-12">

            {/* Mobile Brand */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl">
                ↺
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Expert Decision Replay
              </h1>

              <p className="text-slate-500 text-sm mt-2">
                Preserve decisions. Learn from outcomes.
              </p>
            </div>

            {/* Heading */}
            <div className="mb-8">

              <p className="text-indigo-600 text-sm font-semibold mb-2">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold text-slate-900">
                Sign in to your account
              </h2>

              <p className="text-slate-500 text-sm mt-2">
                Continue to your personalized decision dashboard.
              </p>

            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">

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
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                  focus:border-transparent transition bg-white
                  text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                  focus:border-transparent transition bg-white
                  text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white
                font-semibold hover:bg-indigo-700 active:scale-[0.98]
                transition-all duration-200 shadow-lg shadow-indigo-600/20"
              >
                Sign In
              </button>

            </form>

            {/* Message */}
            {message && (
              <div
                className={`mt-5 p-3 rounded-xl text-sm text-center ${
                  message.includes("successful")
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {message}
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mt-8">

              <div className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-indigo-600 text-lg mb-1">
                  ↺
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Replay
                </p>
              </div>

              <div className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-indigo-600 text-lg mb-1">
                  ✓
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Review
                </p>
              </div>

              <div className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-indigo-600 text-lg mb-1">
                  ◈
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Learn
                </p>
              </div>

            </div>

            {/* Register */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">

              <p className="text-sm text-slate-500">
                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  Create an account
                </Link>
              </p>

            </div>

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

export default Login;

