import { useState } from "react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logo2.jpeg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // असली बैकएंड API कॉल
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setMessage(
        data.message || "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
      setEmail("");
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR:", err);
      setError(
        err?.message || "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-400/10 blur-[100px]" />

      {/* CONTAINER */}
      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-9">

          {/* BRAND HEADER */}
          <div className="mb-8 text-center">
            <div className="relative mx-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-md shadow-blue-500/20">
              <img
                src={logoImg}
                alt="Vraj Creation"
                className="h-16 w-16 rounded-xl object-cover"
              />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Reset Password
            </h1>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Enter your registered email to receive a recovery link
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handlePasswordReset} className="space-y-4" noValidate>
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
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                <span className="shrink-0">✅</span>
                <span>{message}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending Link...
                </span>
              ) : (
                "Send Reset Link →"
              )}
            </button>
          </form>

          {/* BACK TO LOGIN */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs font-medium text-slate-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
          <span>🔒 Secure Recovery</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;