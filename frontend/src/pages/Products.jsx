import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Products = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      const result = response.data;

      if (Array.isArray(result)) {
        setProducts(result);
      } else if (Array.isArray(result?.products)) {
        setProducts(result.products);
      } else if (Array.isArray(result?.data)) {
        setProducts(result.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("PRODUCTS ERROR:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const baseURL =
      api.defaults.baseURL?.replace(
        /\/api\/?$/,
        ""
      ) || "";

    const imagePath = image.startsWith("/")
      ? image
      : `/${image}`;

    return `${baseURL}${imagePath}`;
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${id}`);

      setProducts((prev) =>
        prev.filter(
          (product) => product._id !== id
        )
      );
    } catch (err) {
      console.error("DELETE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  const filteredProducts = products.filter(
    (product) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        !searchText ||
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.sku
          ?.toLowerCase()
          .includes(searchText) ||
        product.category
          ?.toLowerCase()
          .includes(searchText) ||
        product.size
          ?.toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "all" ||
        product.category === category;

      const stock = Number(
        product.stock || 0
      );

      const minimumStock = Number(
        product.minimumStock || 5
      );

      let matchesStock = true;

      if (stockFilter === "in-stock") {
        matchesStock = stock > minimumStock;
      }

      if (stockFilter === "low-stock") {
        matchesStock =
          stock > 0 && stock <= minimumStock;
      }

      if (stockFilter === "out-of-stock") {
        matchesStock = stock === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    }
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div className="animate-pulse">

          <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />

          <div className="mt-3 h-4 w-72 rounded bg-slate-200 dark:bg-slate-800" />

          <div className="mt-6 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />

          <div className="mt-6 rounded-2xl bg-slate-200 dark:bg-slate-800">

            <div className="h-14 border-b border-slate-300 dark:border-slate-700" />

            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-20 border-b border-slate-300 dark:border-slate-700"
                />
              )
            )}

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl dark:bg-red-950/50">
          ⚠️
        </div>

        <h2 className="mt-4 text-lg font-black text-red-800 dark:text-red-300">
          Products could not load
        </h2>

        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={fetchProducts}
          className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          ↻ Try Again
        </button>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-lg text-white dark:bg-white dark:text-slate-950">
              📦
            </span>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Products
            </h1>

          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your inventory and products.
          </p>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={fetchProducts}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/products/add")
            }
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + Add Product
          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <SummaryCard
          title="Total"
          value={products.length}
          icon="📦"
        />

        <SummaryCard
          title="In Stock"
          value={
            products.filter(
              (p) =>
                Number(p.stock || 0) >
                Number(p.minimumStock || 5)
            ).length
          }
          icon="✅"
        />

        <SummaryCard
          title="Low Stock"
          value={
            products.filter((p) => {
              const stock = Number(
                p.stock || 0
              );

              const minimum = Number(
                p.minimumStock || 5
              );

              return (
                stock > 0 &&
                stock <= minimum
              );
            }).length
          }
          icon="⚠️"
        />

        <SummaryCard
          title="Out of Stock"
          value={
            products.filter(
              (p) =>
                Number(p.stock || 0) === 0
            ).length
          }
          icon="🚫"
        />

      </div>

      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* SEARCH */}

          <div className="relative">

            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search name, SKU, size..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white dark:focus:bg-slate-800 dark:focus:ring-white/10"
            />

          </div>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          {/* STOCK */}

          <select
            value={stockFilter}
            onChange={(e) =>
              setStockFilter(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">
              All Stock
            </option>

            <option value="in-stock">
              In Stock
            </option>

            <option value="low-stock">
              Low Stock
            </option>

            <option value="out-of-stock">
              Out of Stock
            </option>

          </select>

        </div>

      </div>

      {/* ================================================= */}
      {/* PRODUCTS TABLE */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">

          <div>

            <h2 className="font-black">
              Product List
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {filteredProducts.length} products found
            </p>

          </div>

        </div>

        {filteredProducts.length === 0 ? (

          <div className="px-5 py-16 text-center">

            <div className="text-5xl">
              📦
            </div>

            <h3 className="mt-4 text-lg font-black">
              No products found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/products/add")
              }
              className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
            >
              + Add Product
            </button>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Product
                  </th>

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Category
                  </th>

                  {/* SIZE */}

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Size
                  </th>

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Purchase
                  </th>

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Selling
                  </th>

                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Stock
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredProducts.map(
                  (product) => (
                    <ProductTableRow
                      key={product._id}
                      product={product}
                      imageUrl={getImageUrl(
                        product.image
                      )}
                      onView={() =>
                        navigate(
                          `/products/${product._id}`
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/products/edit/${product._id}`
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          product._id
                        )
                      }
                    />
                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-bold text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-black">
            {Number(value || 0).toLocaleString(
              "en-IN"
            )}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
          {icon}
        </div>

      </div>

    </div>
  );
};

// =====================================================
// PRODUCT TABLE ROW
// =====================================================

const ProductTableRow = ({
  product,
  imageUrl,
  onView,
  onEdit,
  onDelete,
}) => {
  const [imageError, setImageError] =
    useState(false);

  const stock = Number(
    product.stock || 0
  );

  const minimumStock = Number(
    product.minimumStock || 5
  );

  const getStockStatus = () => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
      };
    }

    if (stock <= minimumStock) {
      return {
        label: "Low Stock",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    };
  };

  const status = getStockStatus();

  // ===================================================
  // SIZE
  // ===================================================

  const productSize =
    product.size &&
    String(product.size).trim()
      ? String(product.size).trim()
      : "--";

  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">

      {/* PRODUCT */}

      <td className="px-5 py-4">

        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >

          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">

            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={
                  product.name ||
                  "Product"
                }
                onError={() =>
                  setImageError(true)
                }
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-xl">
                📦
              </span>
            )}

          </div>

          <div className="min-w-0">

            <p className="max-w-[220px] truncate text-sm font-black hover:underline">
              {product.name ||
                "Unnamed Product"}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Product
            </p>

          </div>

        </button>

      </td>

      {/* SKU */}

      <td className="px-5 py-4">

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {product.sku || "-"}
        </span>

      </td>

      {/* CATEGORY */}

      <td className="px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {product.category || "-"}
      </td>

      {/* SIZE */}

      <td className="px-5 py-4">

        <span
          className={
            productSize === "--"
              ? "text-sm font-semibold text-slate-400"
              : "whitespace-nowrap text-sm font-black text-slate-700 dark:text-slate-200"
          }
        >
          {productSize}
        </span>

      </td>

      {/* PURCHASE */}

      <td className="px-5 py-4 text-sm font-bold">
        ₹
        {Number(
          product.purchasePrice || 0
        ).toLocaleString("en-IN")}
      </td>

      {/* SELLING */}

      <td className="px-5 py-4 text-sm font-black">
        ₹
        {Number(
          product.sellingPrice || 0
        ).toLocaleString("en-IN")}
      </td>

      {/* STOCK */}

      <td className="px-5 py-4">

        <div className="flex flex-col items-start gap-1">

          <span className="text-sm font-black">
            {stock}
          </span>

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-black ${status.className}`}
          >
            {status.label}
          </span>

        </div>

      </td>

      {/* ACTION */}

      <td className="px-5 py-4">

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onView}
            title="View"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            👁️
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ✏️
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
          >
            🗑️
          </button>

        </div>

      </td>

    </tr>
  );
};

export default Products;