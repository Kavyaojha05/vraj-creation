import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo2.jpeg";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30; // Seconds

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState("");

  // Security Lockout States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Handle countdown timer for lockouts
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setFailedAttempts(0);
      setError("");
    }
    return () => clearInterval(timer);
  }, [lockoutTimer, failedAttempts]);

  // Check for Caps Lock key
  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Strict Validation Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      const result = await login(cleanEmail, cleanPassword);

      if (result?.success === true || result?.token || result?.user) {
        setFailedAttempts(0);
        navigate("/dashboard", { replace: true });
        return;
      }

      // Handle Failed Attempt
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_DURATION);
        setError(`Too many invalid attempts! Security lock active for ${LOCKOUT_DURATION}s.`);
      } else {
        setError(
          result?.message || `Invalid credentials. (${MAX_FAILED_ATTEMPTS - attempts} attempts left)`
        );
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_DURATION);
        setError(`Too many invalid attempts! Security lock active for ${LOCKOUT_DURATION}s.`);
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            `Invalid credentials. (${MAX_FAILED_ATTEMPTS - attempts} attempts left)`
        );
      }
    }
  };

  const isFormLocked = lockoutTimer > 0;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-100 px-4 py-8 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* BACKGROUND AMBIENT LIGHT GLOW */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* LIGHT CLEAN CARD CONTAINER */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
          {/* HEADER */}
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
              Enterprise Inventory & Sales Terminal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL INPUT */}
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Authorized Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@vrajcreation.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isFormLocked}
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                {capsLockActive && (
                  <span className="text-[10px] font-bold text-amber-600 animate-pulse">
                    ⚠️ Caps Lock ON
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleKeyUp}
                  disabled={loading || isFormLocked}
                  autoComplete="current-password"
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

            {/* ERROR NOTIFICATION */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ACTION SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || isFormLocked}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying Session...
                </span>
              ) : isFormLocked ? (
                `Locked (${lockoutTimer}s)`
              ) : (
                "Secure Log In →"
              )}
            </button>
          </form>

          {/* FOOTER NOTE */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Don't have an access key?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
          <span>🔒 End-to-End Encrypted Session</span>
          <span>•</span>
          <span>SHA-256 JWT Security</span>
        </div>
      </div>
    </div>
  );
};

export default Login;