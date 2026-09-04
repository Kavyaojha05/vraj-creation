import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductView from "./pages/ProductView";
<<<<<<< HEAD
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import AdminApprovals from "./pages/AdminApprovals";

import AdminLayout from "./components/AdminLayout";
=======
import SalesPage from "./pages/SalesPage"; // Sales Page Import
import PurchasesPage from "./pages/PurchasesPage"; // Purchases Page Import

import AdminLayout from "./components/AdminLayout";

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

// =====================================================
// PROTECTED ROUTE
// =====================================================

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
<<<<<<< HEAD
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950 dark:border-slate-700 dark:border-t-white" />
          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading...
          </p>
=======

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950 dark:border-slate-700 dark:border-t-white" />

          <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading...
          </p>

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

// =====================================================
// ADMIN PAGE
// =====================================================

const AdminPage = ({ children }) => {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

// =====================================================
// APP ROUTES
// =====================================================

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ================================================= */}
      {/* LOGIN */}
      {/* ================================================= */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      {/* ================================================= */}
      {/* REGISTER */}
      {/* ================================================= */}

      <Route
        path="/register"
        element={
          user ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Register />
          )
        }
      />

      {/* ================================================= */}
      {/* DASHBOARD */}
      {/* ================================================= */}

      <Route
        path="/dashboard"
        element={
          <AdminPage>
            <Dashboard />
          </AdminPage>
        }
      />

      {/* ================================================= */}
      {/* PRODUCTS */}
      {/* ================================================= */}

      <Route
        path="/products"
        element={
          <AdminPage>
            <Products />
          </AdminPage>
        }
      />

      {/* ================================================= */}
      {/* ADD PRODUCT */}
      {/* ================================================= */}

      <Route
        path="/products/add"
        element={
          <AdminPage>
            <AddProduct />
          </AdminPage>
        }
      />

      {/* ================================================= */}
      {/* PRODUCT VIEW */}
      {/* ================================================= */}

      <Route
        path="/products/:id"
        element={
          <AdminPage>
            <ProductView />
          </AdminPage>
        }
      />

      {/* ================================================= */}
      {/* EDIT PRODUCT */}
      {/* ================================================= */}

      <Route
        path="/products/edit/:id"
        element={
          <AdminPage>
            <EditProduct />
          </AdminPage>
        }
      />

      {/* ================================================= */}
<<<<<<< HEAD
      {/* SALES */}
=======
      {/* SALES (MEESHO, AMAZON, FLIPKART) */}
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      {/* ================================================= */}

      <Route
        path="/sales"
        element={
          <AdminPage>
            <SalesPage />
          </AdminPage>
        }
      />

      {/* ================================================= */}
      {/* PURCHASES */}
      {/* ================================================= */}

      <Route
        path="/purchases"
        element={
          <AdminPage>
            <PurchasesPage />
          </AdminPage>
        }
      />

      {/* ================================================= */}
<<<<<<< HEAD
      {/* ADMIN APPROVALS (NEWLY ADDED ROUTE) */}
      {/* ================================================= */}

      <Route
        path="/admin/approvals"
        element={
          <AdminPage>
            <AdminApprovals />
          </AdminPage>
        }
      />

      {/* ================================================= */}
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      {/* HOME */}
      {/* ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to={user ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* ================================================= */}
      {/* 404 */}
      {/* ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/dashboard" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
};

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;