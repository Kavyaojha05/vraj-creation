
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo2.jpeg";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
    },
    {
      name: "Products",
      path: "/products",
      icon: "📦",
    },
    {
      name: "Add Product",
      path: "/products/add",
      icon: "➕",
    },
    {
      name: "Payments & Orders",
      path: "/orders",
      icon: "💳",
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: "🧾",
    },
    {
      name: "User Approvals",
      path: "/admin/approvals",
      icon: "🛡️",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-900 p-4 text-slate-100 shadow-xl">
      {/* =================================================
          UPPER SECTION
      ================================================= */}
      <div>
        {/* Logo Section */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-800 px-3 py-4">
          <img
            src={logoImg}
            alt="Vraj Creation Logo"
            className="h-10 w-10 rounded-lg border border-slate-700 bg-slate-800 object-cover"
          />

          <div>
            <h2 className="text-lg font-bold leading-tight tracking-wide text-white">
              Vraj Creation
            </h2>

            <span className="text-xs font-medium text-indigo-400">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <span className="text-lg">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* =================================================
          BOTTOM SECTION
      ================================================= */}
      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-sm font-bold text-indigo-400">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : "A"}
          </div>

          <div className="overflow-hidden">
            <strong className="block truncate text-sm font-semibold text-slate-200">
              {user?.name || "Admin"}
            </strong>

            <small className="block truncate text-xs capitalize text-slate-400">
              {user?.role || "admin"}
            </small>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-600 hover:text-white"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;