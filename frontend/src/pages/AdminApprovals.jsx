import { useEffect, useState } from "react";
import api from "../services/api";

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/users/pending");
      setPendingUsers(res.data.users || []);
    } catch (err) {
      console.error("FETCH PENDING USERS ERROR:", err);
      setError("Pending users load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/users/approve/${id}`);
      alert("User successfully approved!");
      // List mein se approve hone ke baad user ko hata dein
      setPendingUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      console.error("APPROVE ERROR:", err);
      alert("User approve karne mein error aayi.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-semibold text-slate-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Admin User Approvals
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage pending registration requests and grant system access
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Pending Access Requests ({pendingUsers.length})
          </h2>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="px-4 py-16 text-center text-slate-400">
            <div className="mb-3 text-4xl">📭</div>
            <p className="font-bold text-slate-700 dark:text-slate-200">No pending requests</p>
            <p className="mt-1 text-xs text-slate-400">All user accounts are currently active.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Requested Date</th>
                  <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingUsers.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-100">{user.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleApprove(user._id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
                      >
                        Accept / Approve ✓
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;