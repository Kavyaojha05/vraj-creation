import { useEffect, useState } from "react";
import api from "../services/api";

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] =
    useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH PENDING USERS
  // =====================================================

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/users/pending");

      console.log(
        "PENDING USERS RESPONSE:",
        response.data
      );

      setPendingUsers(
        response.data?.users || []
      );
    } catch (err) {
      console.error(
        "FETCH PENDING USERS ERROR:",
        err
      );

      const status =
        err.response?.status;

      const message =
        err.response?.data?.message;

      if (status === 401) {
        setError(
          "Authentication token missing ya invalid hai."
        );
      } else if (status === 403) {
        setError(
          "Sirf Admin pending users dekh sakta hai."
        );
      } else if (status === 404) {
        setError(
          "API route not found. Backend routes check karo."
        );
      } else {
        setError(
          message ||
            "Pending users load nahi ho paaye."
        );
      }

      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // =====================================================
  // APPROVE USER
  // =====================================================

  const handleApprove = async (id) => {
    if (!id) {
      alert("Invalid user ID.");
      return;
    }

    try {
      setApprovingId(id);

      const response =
        await api.put(
          `/users/approve/${id}`
        );

      console.log(
        "APPROVE USER RESPONSE:",
        response.data
      );

      // Remove approved user from list
      setPendingUsers(
        (previousUsers) =>
          previousUsers.filter(
            (user) =>
              user._id !== id
          )
      );

      alert(
        response.data?.message ||
          "User successfully approved!"
      );
    } catch (err) {
      console.error(
        "APPROVE USER ERROR:",
        err
      );

      const message =
        err.response?.data?.message;

      alert(
        message ||
          "User approve karne mein error aayi."
      );
    } finally {
      setApprovingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pending users load ho rahe hain...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="w-full space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin User Approvals
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage pending registration requests
            and grant system access
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPendingUsers}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              ⚠️
            </span>

            <div className="flex-1">
              <p className="font-semibold text-red-700 dark:text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchPendingUsers}
                className="mt-2 text-sm font-semibold text-red-700 underline dark:text-red-400"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Card Header */}

        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pending Access Requests
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Users waiting for admin approval
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pendingUsers.length} Pending
          </span>
        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {pendingUsers.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center px-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl dark:bg-slate-800">
                ✓
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No pending requests
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Abhi koi user approval ke liye
                pending nahi hai.
              </p>
            </div>
          </div>
        ) : (
          /* =================================================
             USERS
          ================================================= */

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {pendingUsers.map(
              (user) => (
                <div
                  key={user._id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between dark:hover:bg-slate-800/40"
                >
                  {/* User Info */}

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {user.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </h3>

                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>

                      {user.createdAt && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          Requested:{" "}
                          {new Date(
                            user.createdAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status + Button */}

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Pending
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleApprove(
                          user._id
                        )
                      }
                      disabled={
                        approvingId ===
                        user._id
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {approvingId ===
                      user._id
                        ? "Approving..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;