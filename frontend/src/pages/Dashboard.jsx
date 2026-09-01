import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getImageUrl = (image) => {
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
  };

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

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const totalStock = products.reduce(
      (total, product) => total + Number(product?.stock || 0),
      0
    );

    const lowStock = products.filter((product) => {
      const stock = Number(product?.stock || 0);
      const minimumStock = Number(product?.minimumStock ?? 5);
      return stock > 0 && stock <= minimumStock;
    }).length;

    const outOfStock = products.filter(
      (product) => Number(product?.stock || 0) === 0
    ).length;

    const inventoryValue = products.reduce((total, product) => {
      const purchasePrice = Number(product?.purchasePrice || 0);
      const stock = Number(product?.stock || 0);
      return total + purchasePrice * stock;
    }, 0);

    const sellingValue = products.reduce((total, product) => {
      const sellingPrice = Number(product?.sellingPrice || 0);
      const stock = Number(product?.stock || 0);
      return total + sellingPrice * stock;
    }, 0);

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
      inventoryValue,
      sellingValue,
      potentialMargin: sellingValue - inventoryValue,
    };
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
      )
      .slice(0, 5);
  }, [products]);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const getStockStatus = (product) => {
    const stock = Number(product?.stock || 0);
    const minimum = Number(product?.minimumStock ?? 5);

    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400",
      };
    }

    if (stock <= minimum) {
      return {
        label: "Low Stock",
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
      };
    }

    return {
      label: "In Stock",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400",
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white" />
          <p className="text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <span>❌ {error}</span>
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="w-fit font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Products</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {stats.totalProducts}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl dark:bg-blue-950/50">
              📦
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Products in inventory</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Stock</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {stats.totalStock.toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/50">
              📊
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Total available quantity</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock</p>
              <h2 className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-500">
                {stats.lowStock}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl dark:bg-amber-950/50">
              ⚠️
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Need restocking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Value</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                {formatCurrency(stats.inventoryValue)}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl dark:bg-violet-950/50">
              💰
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Based on purchase price</p>
        </div>
      </div>

      {/* SECONDARY CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Current Selling Value</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {formatCurrency(stats.sellingValue)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Total stock × selling price</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-500">
            {stats.outOfStock}
          </p>
          <p className="mt-2 text-xs text-slate-400">Products with zero stock</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Potential Margin</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              stats.potentialMargin >= 0
                ? "text-emerald-600 dark:text-emerald-500"
                : "text-red-600 dark:text-red-500"
            }`}
          >
            {formatCurrency(stats.potentialMargin)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Selling value − purchase value</p>
        </div>
      </div>

      {/* RECENT PRODUCTS */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">Recent Products</h2>
            <p className="mt-1 text-xs text-slate-400">
              Latest products added to inventory
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="w-fit text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            View All →
          </button>
        </div>

        {recentProducts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">
              📦
            </div>
            <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">
              No products yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add your first product to get started.
            </p>
            <button
              type="button"
              onClick={() => navigate("/products/add")}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              + Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SKU
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selling Price
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const imageUrl = getImageUrl(product?.image);

                  return (
                    <tr
                      key={product?._id || product?.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
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
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate font-semibold text-slate-800 dark:text-white">
                              {product?.name || "Unnamed Product"}
                            </p>
                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                              {product?.subcategory || "No subcategory"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {product?.sku || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {product?.category || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            Number(product?.stock || 0) === 0
                              ? "text-red-600 dark:text-red-400"
                              : Number(product?.stock || 0) <=
                                Number(product?.minimumStock ?? 5)
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {Number(product?.stock || 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(product?.sellingPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
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