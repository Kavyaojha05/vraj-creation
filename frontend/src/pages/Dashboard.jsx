import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const DEFAULT_IMAGE =
  "https://via.placeholder.com/80";

const Dashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/products");

        const data = response.data;

        let productList = [];

        if (Array.isArray(data)) {
          productList = data;
        } else if (
          Array.isArray(data?.products)
        ) {
          productList = data.products;
        } else if (
          Array.isArray(data?.data)
        ) {
          productList = data.data;
        }

        setProducts(productList);
      } catch (err) {
        console.error(
          "Dashboard Error:",
          err
        );

        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
          "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =====================================================
  // AUTO REFRESH AFTER PURCHASE / INVENTORY UPDATE
  // =====================================================

  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchProducts(true);
    };

    window.addEventListener(
      "inventory-updated",
      handleInventoryUpdate
    );

    return () => {
      window.removeEventListener(
        "inventory-updated",
        handleInventoryUpdate
      );
    };
  }, [fetchProducts]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;
    let sellingValue = 0;

    products.forEach((product) => {
      const stock = Number(
        product.stock || 0
      );

      const minimumStock = Number(
        product.minimumStock || 5
      );

      const purchasePrice = Number(
        product.purchasePrice || 0
      );

      const sellingPrice = Number(
        product.sellingPrice || 0
      );

      totalStock += stock;

      if (stock === 0) {
        outOfStock++;
      } else if (
        stock <= minimumStock
      ) {
        lowStock++;
      }

      inventoryValue +=
        purchasePrice * stock;

      sellingValue +=
        sellingPrice * stock;
    });

    return {
      totalProducts: products.length,
      totalStock,
      lowStock,
      outOfStock,
      inventoryValue,
      sellingValue,
      potentialMargin:
        sellingValue - inventoryValue,
    };
  }, [products]);

  // =====================================================
  // RECENT PRODUCTS
  // =====================================================

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        return (
          new Date(
            b.createdAt || 0
          ).getTime() -
          new Date(
            a.createdAt || 0
          ).getTime()
        );
      })
      .slice(0, 8);
  }, [products]);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getImageUrl = (image) => {
    if (!image) {
      return DEFAULT_IMAGE;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return image;
  };

  const getStockStatus = (product) => {
    const stock = Number(
      product.stock || 0
    );

    const minimumStock = Number(
      product.minimumStock || 5
    );

    if (stock === 0) {
      return {
        text: "Out of Stock",
        className:
          "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      };
    }

    if (stock <= minimumStock) {
      return {
        text: "Low Stock",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      };
    }

    return {
      text: "In Stock",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    fetchProducts(true);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-white" />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vraj Creation inventory overview
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* =================================================
            MAIN STATS - ONLY ONE SET
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL PRODUCTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Products
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalProducts}
              </h2>

              <div className="rounded-xl bg-blue-100 px-3 py-2 text-xl dark:bg-blue-500/10">
                📦
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Products in catalog
            </p>
          </div>

          {/* TOTAL STOCK */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Stock
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalStock}
              </h2>

              <div className="rounded-xl bg-indigo-100 px-3 py-2 text-xl dark:bg-indigo-500/10">
                🏷️
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Available quantity
            </p>
          </div>

          {/* LOW STOCK */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Low Stock
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.lowStock}
              </h2>

              <div className="rounded-xl bg-amber-100 px-3 py-2 text-xl dark:bg-amber-500/10">
                ⚠️
              </div>
            </div>

            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Needs attention
            </p>
          </div>

          {/* OUT OF STOCK */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Out of Stock
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.outOfStock}
              </h2>

              <div className="rounded-xl bg-red-100 px-3 py-2 text-xl dark:bg-red-500/10">
                ❌
              </div>
            </div>

            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              Currently unavailable
            </p>
          </div>
        </div>

        {/* =================================================
            FINANCIAL SUMMARY - ONLY ONE SET
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* INVENTORY VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Inventory Value
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(
                stats.inventoryValue
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Purchase price × stock
            </p>
          </div>

          {/* SELLING VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Selling Value
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(
                stats.sellingValue
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Selling price × stock
            </p>
          </div>

          {/* POTENTIAL MARGIN */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Potential Margin
            </p>

            <h2
              className={`mt-2 text-2xl font-bold ${stats.potentialMargin >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
                }`}
            >
              {formatCurrency(
                stats.potentialMargin
              )}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Selling value − inventory value
            </p>
          </div>
        </div>

        {/* =================================================
            RECENT PRODUCTS - ONLY ONE TABLE
        ================================================= */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Products
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Latest products added to inventory
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              View All ({products.length})
            </button>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    SKU
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Purchase
                  </th>

                  <th className="px-5 py-4">
                    Selling
                  </th>

                  <th className="px-5 py-4">
                    Stock
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentProducts.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map(
                    (product) => {
                      const status =
                        getStockStatus(
                          product
                        );

                      return (
                        <tr
                          key={
                            product._id
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          {/* PRODUCT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(
                                  product.image
                                )}
                                alt={
                                  product.name ||
                                  "Product"
                                }
                                className="h-12 w-12 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.src =
                                    DEFAULT_IMAGE;
                                }}
                              />

                              <div className="min-w-0">
                                <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                                  {product.name ||
                                    "Unnamed Product"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {product.subcategory ||
                                    "Handicraft"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {product.sku ||
                                "-"}
                            </span>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {product.category ||
                              "-"}
                          </td>

                          {/* PURCHASE PRICE */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(
                              product.purchasePrice
                            )}
                          </td>

                          {/* SELLING PRICE */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(
                              product.sellingPrice
                            )}
                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {Number(
                                product.stock ||
                                0
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                            >
                              {status.text}
                            </span>
                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(
                              product.createdAt
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE PRODUCTS
          ================================================= */}

          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {recentProducts.length ===
              0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No products found.
              </div>
            ) : (
              recentProducts.map(
                (product) => {
                  const status =
                    getStockStatus(
                      product
                    );

                  return (
                    <div
                      key={product._id}
                      className="p-4"
                    >
                      <div className="flex gap-3">
                        <img
                          src={getImageUrl(
                            product.image
                          )}
                          alt={
                            product.name ||
                            "Product"
                          }
                          className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                          onError={(
                            e
                          ) => {
                            e.currentTarget.src =
                              DEFAULT_IMAGE;
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-slate-900 dark:text-white">
                                {product.name ||
                                  "Unnamed Product"}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                SKU:{" "}
                                {product.sku ||
                                  "-"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}
                            >
                              {status.text}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-[10px] text-slate-400">
                                Stock
                              </p>

                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {Number(
                                  product.stock ||
                                  0
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400">
                                Purchase
                              </p>

                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(
                                  product.purchasePrice
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400">
                                Selling
                              </p>

                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(
                                  product.sellingPrice
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="py-6 text-center text-xs text-slate-400">
          Vraj Creation • Inventory Management
        </div>
      </div>
    </div>
  );
};

export default Dashboard;