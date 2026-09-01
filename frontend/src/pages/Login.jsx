import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo2.jpeg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const result = await login(email.trim(), password);

      if (
        result?.success === true ||
        result?.token ||
        result?.user
      ) {
        navigate("/dashboard", {
          replace: true,
        });
        return;
      }

      setError(
        result?.message ||
          result?.error ||
          "Invalid email or password"
      );
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* LIGHT LOGIN CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {/* BRAND HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
              <img
                src={logoImg}
                alt="Vraj Creation Logo"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Vraj Creation
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL INPUT */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* PASSWORD INPUT WITH TOGGLE */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-600">
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                  Logging in...
                </span>
              ) : (
                "Login →"
              )}
            </button>
          </form>

          {/* REGISTER LINK */}
          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-slate-900 transition hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;