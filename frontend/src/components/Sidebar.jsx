import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
<<<<<<< HEAD
import logoImg from "../assets/logo2.jpeg";
=======
import logoImg from "../assets/logo2.jpeg"; 
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

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
<<<<<<< HEAD
    {
      name: "User Approvals",
      path: "/admin/approvals",
      icon: "🛡️",
    },
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 shadow-xl border-r border-slate-800 shrink-0 sticky top-0">
      
      {/* Upper Section: Logo & Navigation */}
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <img
            src={logoImg}
            alt="Vraj Creation Logo"
            className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700"
          />
          <div>
            <h2 className="font-bold text-lg leading-tight tracking-wide text-white">
              Vraj Creation
            </h2>
            <span className="text-xs text-indigo-400 font-medium">
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
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: User Info & Logout */}
      <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30 text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="overflow-hidden">
            <strong className="block text-sm font-semibold text-slate-200 truncate">
              {user?.name || "Admin"}
            </strong>
            <small className="block text-xs text-slate-400 capitalize truncate">
              {user?.role || "admin"}
            </small>
          </div>
        </div>

        {/* Logout Button */}
        <button
<<<<<<< HEAD
          type="button"
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white font-medium text-sm transition-all duration-200"
        >
          <span>🚪</span> Logout
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;