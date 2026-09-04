import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
<<<<<<< HEAD
import logoImg from "../assets/logo2.jpeg";
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
<<<<<<< HEAD
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
=======
  const [error, setError] = useState("");
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
<<<<<<< HEAD
    setSuccessMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !confirmPassword) {
=======

    if (!name.trim() || !email.trim() || !password) {
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      setError("All fields are required");
      return;
    }

<<<<<<< HEAD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
=======
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      setError("Passwords do not match");
      return;
    }

<<<<<<< HEAD
    try {
      const result = await register(cleanName, cleanEmail, cleanPassword);

      if (result?.success === true) {
        setSuccessMsg(
          result.message || "Registration successful! Admin approval ke baad login kar sakenge."
        );
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 4000);
        return;
      }

      setError(result?.message || result?.error || "Registration failed");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed. Please try again."
=======
    const result = await register(
      name,
      email,
      password
    );

    if (result.success) {
      navigate("/dashboard", {
        replace: true,
      });
    } else {
      setError(
        result.message || "Registration failed"
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      );
    }
  };

  return (
<<<<<<< HEAD
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-100 px-4 py-8 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center p-1 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
              <img
                src={logoImg}
                alt="Vraj Creation"
                className="h-14 w-14 rounded-xl object-cover"
              />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Vraj Creation
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Create an account request for admin approval
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Pawan Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Authorized Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@vrajcreation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
            )}
=======
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">

      <div className="w-full max-w-md">

        {/* LOGO / BRAND */}

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg dark:bg-white dark:text-slate-950">
            VC
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Vraj Creation
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create your admin account
          </p>

        </div>

        {/* REGISTER CARD */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-8">

          <div className="mb-6">

            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              Create Account
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your details to get started.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:bg-slate-800 dark:focus:ring-white/10"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
              />

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
              />

            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* BUTTON */}
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

            <button
              type="submit"
              disabled={loading}
<<<<<<< HEAD
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </span>
              ) : (
                "Request Access →"
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already approved?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
=======
              className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* LOGIN LINK */}

          <div className="mt-6 border-t border-slate-100 pt-6 text-center dark:border-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}

              <Link
                to="/login"
                className="font-bold text-slate-950 hover:underline dark:text-white"
              >
                Login
              </Link>
            </p>

          </div>

        </div>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Vraj Creation
        </p>

      </div>

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    </div>
  );
};

export default Register;