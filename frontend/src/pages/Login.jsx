import { useEffect, useState } from "react";
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

  // Security lockout states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // ==========================================
  // LOCKOUT COUNTDOWN
  // ==========================================
  useEffect(() => {
    if (lockoutTimer <= 0) {
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        setFailedAttempts(0);
        setError("");
      }

      return undefined;
    }

    const timer = setInterval(() => {
      setLockoutTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimer, failedAttempts]);

  // ==========================================
  // CAPS LOCK DETECTION
  // ==========================================
  const handleKeyUp = (e) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutTimer > 0) {
      return;
    }

    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password validation
    if (!cleanPassword || cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      const result = await login(cleanEmail, cleanPassword);

      if (
        result?.success === true ||
        result?.token ||
        result?.user
      ) {
        setFailedAttempts(0);
        setLockoutTimer(0);
        setError("");

        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // Failed login attempt
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_DURATION);

        setError(
          `Too many invalid attempts! Security lock active for ${LOCKOUT_DURATION}s.`
        );
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - attempts;

        setError(
          result?.message ||
            result?.error ||
            `Invalid credentials. ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } left.`
        );
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_DURATION);

        setError(
          `Too many invalid attempts! Security lock active for ${LOCKOUT_DURATION}s.`
        );
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - attempts;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            `Login failed. ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } left.`
        );
      }
    }
  };

  const isFormLocked = lockoutTimer > 0;
  const isDisabled = loading || isFormLocked;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 font-sans selection:bg-blue-500 selection:text-white">

      {/* ==========================================
          BACKGROUND AMBIENT GLOW
      ========================================== */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[100px]" />

      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-400/10 blur-[100px]" />

      {/* ==========================================
          LOGIN CONTAINER
      ========================================== */}
      <div className="relative w-full max-w-md">

        {/* CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-9">

          {/* ==========================================
              BRAND HEADER
          ========================================== */}
          <div className="mb-8 text-center">

            <div className="relative mx-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-md shadow-blue-500/20">

              <img
                src={logoImg}
                alt="Vraj Creation"
                className="h-16 w-16 rounded-xl object-cover"
              />

            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Vraj Creation
            </h1>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Enterprise Inventory &amp; Sales Terminal
            </p>

          </div>

          {/* ==========================================
              LOGIN FORM
          ========================================== */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Authorized Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@vrajcreation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* PASSWORD */}
            <div>

              <div className="mb-1.5 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>

                {capsLockActive && (
                  <span className="animate-pulse text-[10px] font-bold text-amber-600">
                    ⚠️ Caps Lock ON
                  </span>
                )}

              </div>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleKeyUp}
                  disabled={isDisabled}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isDisabled}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </div>

            {/* ==========================================
                ERROR MESSAGE
            ========================================== */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ==========================================
                LOGIN BUTTON
            ========================================== */}
            <button
              type="submit"
              disabled={isDisabled}
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

          {/* ==========================================
              REGISTER
          ========================================== */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">

            <p className="text-xs font-medium text-slate-500">
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

        {/* ==========================================
            SECURITY FOOTER
        ========================================== */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
          <span>🔒 Secure Session</span>
          <span>•</span>
          <span>JWT Authentication</span>
        </div>

      </div>
    </div>
  );
};

export default Login;