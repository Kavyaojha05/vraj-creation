import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getImageUrl = useCallback((image) => {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    const baseURL = api.defaults?.baseURL || "http://localhost:5000/api";
    const serverURL = baseURL.replace(/\/api\/?$/, "");
    const cleanImage = image.replace(/^\/+/, "");
    if (cleanImage.startsWith("uploads/")) {
      return `${serverURL}/${cleanImage}`;
    }
    return `${serverURL}/uploads/${cleanImage}`;
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");
      const data = response.data;

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data?.products)) {
        setProducts(data.products);
      } else if (Array.isArray(data?.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("DASHBOARD PRODUCTS ERROR:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }
      setError(
        err.response?.data?.message || "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Single-pass high-speed calculations
  const stats = useMemo(() => {
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inStock = 0;
    let inventoryValue = 0;
    let sellingValue = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stock = Number(p?.stock || 0);
      const minStock = Number(p?.minimumStock ?? 5);
      const buyPrice = Number(p?.purchasePrice || 0);
      const sellPrice = Number(p?.sellingPrice || 0);

      totalStock += stock;
      inventoryValue += buyPrice * stock;
      sellingValue += sellPrice * stock;

      if (stock === 0) {
        outOfStock++;
      } else if (stock <= minStock) {
        lowStock++;
      } else {
        inStock++;
      }
    }

    return {
      totalProducts: products.length,
      totalStock,
      lowStock,
      outOfStock,
      inStock,
      inventoryValue,
      sellingValue,
      potentialMargin: sellingValue - inventoryValue,
    };
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 6);
  }, [products]);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  const getStockStatus = (product) => {
    const stock = Number(product?.stock || 0);
    const minimum = Number(product?.minimumStock ?? 5);

    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        dot: "bg-rose-500",
      };
    }
    if (stock <= minimum) {
      return {
        label: "Low Stock",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
      };
    }
    return {
      label: "In Stock",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse p-2 sm:p-4">
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER SECTION (CLEAN - NO BUTTONS) */}
      <div className="border-b border-slate-200/60 pb-5 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          Real-time performance metrics, inventory valuation & stock health
        </p>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
          <span className="flex items-center gap-2">⚠️ {error}</span>
          <button
            type="button"
            onClick={fetchProducts}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Products */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Catalog
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              📦
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {stats.totalProducts}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {stats.inStock} Active
              </span>
              <span className="text-xs text-slate-400">SKU items ready</span>
            </div>
          </div>
        </div>

        {/* Total Stock */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Units
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              📊
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {stats.totalStock.toLocaleString("en-IN")}
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Total stock across all products
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stock Warnings
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-lg text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              ⚠️
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {stats.lowStock}
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Items below minimum limit
            </p>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inventory Value
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-lg text-violet-600 dark:bg-violet-400/10 dark:text-violet-400">
              💰
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(stats.inventoryValue)}
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Calculated on purchase price
            </p>
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Retail Value */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Retail Value
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(stats.sellingValue)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Total stock × selling price
          </p>
        </div>

        {/* Out of Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Out of Stock Items
          </p>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.outOfStock}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Products with zero available inventory
          </p>
        </div>

        {/* Potential Margin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Potential Margin
          </p>
          <p
            className={`mt-2 text-2xl font-black ${
              stats.potentialMargin >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(stats.potentialMargin)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Selling value − purchase value
          </p>
        </div>
      </div>

      {/* RECENT PRODUCTS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Recent Products
            </h2>
            <p className="text-xs font-medium text-slate-400">
              Latest items added to your catalog
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All →
          </button>
        </div>

        {recentProducts.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
              📦
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
              No products found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Catalog currently empty
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-4 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Stock</th>
                  <th className="px-4 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const imageUrl = getImageUrl(product?.image);

                  return (
                    <tr
                      key={product?._id || product?.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product?.name || "Product"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-base">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate font-bold text-slate-900 dark:text-white">
                              {product?.name || "Unnamed Product"}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {product?.subcategory || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {product?.sku || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {product?.category || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {Number(product?.stock || 0)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(product?.sellingPrice)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stockStatus.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dot}`} />
                          {stockStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;