import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
      );
    }
  };

  return (
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

            <button
              type="submit"
              disabled={loading}
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

    </div>
  );
};

export default Register;