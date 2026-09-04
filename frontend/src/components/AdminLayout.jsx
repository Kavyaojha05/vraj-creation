import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo2.jpeg"; // Image logo import

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Products", path: "/products", icon: "📦" },
    { name: "Add Product", path: "/products/add", icon: "➕" },
    { name: "Sales", path: "/sales", icon: "💰" },
    { name: "Purchase", path: "/purchases", icon: "🛒" },
<<<<<<< HEAD
    { name: "User Approvals", path: "/admin/approvals", icon: "🛡️" }, // <-- Yahan add kar diya gaya hai
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO SECTION WITH IMAGE */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800 lg:h-20">
          <img
            src={logoImg}
            alt="Vraj Creation Logo"
            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0">
            <h1 className="font-black text-base leading-tight truncate">Vraj Creation</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-2xl text-slate-400 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* MENU */}
<<<<<<< HEAD
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
=======
        <nav className="flex-1 px-3 py-5">
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* USER / LOGOUT */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 font-bold text-white dark:bg-white dark:text-slate-950">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.name || "Admin"}</p>
              <p className="truncate text-xs text-slate-400">
                {user?.email || "Administrator"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN WRAPPER */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* SINGLE TOP HEADER WITH LOGO */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:h-20 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl dark:border-slate-700 dark:bg-slate-800 lg:hidden"
            >
              ☰
            </button>
            <img
              src={logoImg}
              alt="Vraj Creation"
              className="h-9 w-9 rounded-lg object-cover sm:hidden border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="font-black">Vraj Creation</p>
              <p className="text-xs text-slate-400">Inventory Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
<<<<<<< HEAD
            {/* Quick Approvals Button near Theme Toggle */}
            <NavLink
              to="/admin/approvals"
              title="User Approvals"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              🛡️
            </NavLink>

=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-bold text-white dark:bg-white dark:text-slate-950">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* FULL WIDTH PAGE CONTENT */}
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;