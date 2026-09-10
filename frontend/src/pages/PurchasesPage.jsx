import { useEffect, useMemo, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import api from "../services/api";

const DEFAULT_IMAGE = "https://via.placeholder.com/80";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:caret-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:bg-slate-800 dark:focus:text-white";

const FILE_INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-800 dark:file:bg-slate-700 dark:file:text-white";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const createInitialForm = () => ({
  productId: "",
  purchaseDate: getToday(),
  productName: "",
  rawCost: "",
  supplierName: "",
  quantity: 1,
  productImage: "",
  imageFile: null,
});

const escapeHtml = (value) => {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getProductsFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }
  return [];
};

const getPurchasesFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.data?.purchases)) {
    return response.data.purchases;
  }
  return [];
};

const PurchasePage = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createInitialForm());

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await api.get("/purchases");
      setPurchases(getPurchasesFromResponse(response));
    } catch (error) {
      console.error("FETCH PURCHASES ERROR:", error);
      throw error;
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(getProductsFromResponse(response));
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([fetchPurchases(), fetchProducts()]);
    } catch (error) {
      console.error("FETCH PURCHASE PAGE ERROR:", error);
      setError(
        error.response?.data?.message ||
          "Purchase aur product data load nahi ho raha."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = useMemo(() => {
    if (!formData.productId) return null;
    return (
      products.find(
        (product) => String(product._id) === String(formData.productId)
      ) || null
    );
  }, [products, formData.productId]);

  const filteredPurchases = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return purchases;

    return purchases.filter((item) => {
      return (
        String(item.productName || "").toLowerCase().includes(search) ||
        String(item.productId || "").toLowerCase().includes(search) ||
        String(item.supplierName || "").toLowerCase().includes(search)
      );
    });
  }, [purchases, searchTerm]);

  const filteredModalProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const nameMatch = String(p.name || "").toLowerCase().includes(query);
      const skuMatch = String(p.sku || "").toLowerCase().includes(query);
      return nameMatch || skuMatch;
    });
  }, [products, productSearchQuery]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const allVisibleIds = filteredPurchases.map((item) => item._id);
      setSelectedIds(allVisibleIds);
    } else {
      setSelectedIds([]);
    }
  };

  const calculateTotalPurchaseCost = (item) => {
    const cost = Number(item.rawCost) || 0;
    const quantity = Number(item.quantity) || 0;
    return cost * quantity;
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(createInitialForm());
    setProductSearchQuery("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    const matchingProduct = products.find(
      (product) => String(product._id) === String(item.productId)
    );

    setEditingId(item._id);
    setFormData({
      productId: item.productId || "",
      purchaseDate: item.purchaseDate || getToday(),
      productName: matchingProduct?.name || item.productName || "",
      rawCost: item.rawCost ?? "",
      supplierName: item.supplierName || "",
      quantity: item.quantity ?? 1,
      productImage: item.productImage || matchingProduct?.image || "",
      imageFile: null,
    });
    setProductSearchQuery(matchingProduct?.name || item.productName || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(createInitialForm());
    setProductSearchQuery("");
    setIsProductDropdownOpen(false);
    setError("");
    setSaving(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectProduct = (product) => {
    if (!product) {
      setFormData((prev) => ({
        ...prev,
        productId: "",
        productName: "",
        rawCost: "",
        productImage: "",
      }));
      setProductSearchQuery("");
    } else {
      setFormData((prev) => ({
        ...prev,
        productId: product._id,
        productName: product.name || "",
        rawCost: product.purchasePrice ?? "",
        productImage: product.image || "",
      }));
      setProductSearchQuery(product.name || "");
    }
    setIsProductDropdownOpen(false);
    setError("");
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5 MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      productImage: previewUrl,
      imageFile: file,
    }));
    setError("");
  };

  const handleRemoveImage = () => {
    if (formData.productImage && formData.productImage.startsWith("blob:")) {
      URL.revokeObjectURL(formData.productImage);
    }
    setFormData((prev) => ({ ...prev, productImage: "", imageFile: null }));
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Kya aap is purchase entry ko delete karna chahte hain?\n\nDelete karne par backend Product stock ko bhi automatically adjust karega."
    );

    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/purchases/${id}`);
      setPurchases((prev) => prev.filter((item) => item._id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      await fetchProducts();
      window.dispatchEvent(new Event("inventory-updated"));
    } catch (error) {
      console.error("DELETE PURCHASE ERROR:", error);
      setError(error.response?.data?.message || "Purchase delete nahi ho pa raha.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const productId = String(formData.productId || "").trim();
    const productName = String(formData.productName || "").trim();
    const supplierName = String(formData.supplierName || "").trim();
    const rawCost = Number(formData.rawCost);
    const quantity = Number(formData.quantity);

    if (!productId) {
      setError("Please select a product.");
      return;
    }
    if (!productName) {
      setError("Product name is missing.");
      return;
    }
    if (!supplierName) {
      setError("Please enter supplier name.");
      return;
    }
    if (!formData.purchaseDate) {
      setError("Please select purchase date.");
      return;
    }
    if (!Number.isFinite(rawCost) || rawCost <= 0) {
      setError("Raw cost must be greater than 0.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a whole number greater than 0.");
      return;
    }

    const productExists = products.some((p) => String(p._id) === String(productId));
    if (!productExists) {
      setError("Selected product database mein nahi mila.");
      return;
    }

    const data = new FormData();
    data.append("productId", productId);
    data.append("purchaseDate", formData.purchaseDate);
    data.append("productName", productName);
    data.append("rawCost", String(rawCost));
    data.append("supplierName", supplierName);
    data.append("quantity", String(quantity));

    if (formData.imageFile) {
      data.append("imageFile", formData.imageFile);
    }

    try {
      setSaving(true);
      if (editingId) {
        const response = await api.put(`/purchases/${editingId}`, data);
        const updatedPurchase = response.data?.purchase || response.data;
        setPurchases((prev) =>
          prev.map((item) => (item._id === editingId ? updatedPurchase : item))
        );
      } else {
        const response = await api.post("/purchases", data);
        const newPurchase = response.data?.purchase || response.data;
        setPurchases((prev) => [newPurchase, ...prev]);
      }

      await fetchProducts();
      window.dispatchEvent(new Event("inventory-updated"));
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(createInitialForm());
      setProductSearchQuery("");
      setError("");
    } catch (error) {
      console.error("SAVE PURCHASE ERROR:", error);
      setError(error.response?.data?.message || "Purchase save nahi ho pa raha.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const itemsToExport = purchases.filter((item) =>
      selectedIds.includes(item._id)
    );

    if (!itemsToExport.length) {
      setError("PDF export ke liye kripya table mein se kam se kam ek product select karein.");
      return;
    }

    const totalQty = itemsToExport.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    );
    const totalExp = itemsToExport.reduce(
      (total, item) => total + calculateTotalPurchaseCost(item),
      0
    );

    let wrapper = null;

    try {
      setError("");

      const reportRows = itemsToExport
        .map((item, index) => {
          const productName = escapeHtml(item.productName || "-");
          const matchingProd = products.find(p => String(p._id) === String(item.productId));
          const prodIdDisplay = matchingProd?.sku || matchingProd?.name || (typeof item.productId === 'string' ? item.productId.slice(-6).toUpperCase() : "-");
          const purchaseDate = escapeHtml(item.purchaseDate || "-");
          const supplierName = escapeHtml(item.supplierName || "-");
          const quantity = Number(item.quantity || 0);
          const rawCost = Number(item.rawCost || 0);
          const totalExpense = calculateTotalPurchaseCost(item);

          return `
            <tr style="page-break-inside:avoid; break-inside:avoid;">
              <td style="padding:6px 4px; border:1px solid #cbd5e1; text-align:center;">${index + 1}</td>
              <td style="padding:6px 5px; border:1px solid #cbd5e1; overflow-wrap:anywhere; word-break:break-word;">${productName}</td>
              <td style="padding:6px 5px; border:1px solid #cbd5e1; font-size:9px;">${escapeHtml(prodIdDisplay)}</td>
              <td style="padding:6px 5px; border:1px solid #cbd5e1;">${purchaseDate}</td>
              <td style="padding:6px 5px; border:1px solid #cbd5e1; overflow-wrap:anywhere;">${supplierName}</td>
              <td style="padding:6px 4px; border:1px solid #cbd5e1; text-align:center;">${quantity}</td>
              <td style="padding:6px 4px; border:1px solid #cbd5e1; text-align:right; white-space:nowrap;">₹${rawCost.toLocaleString("en-IN")}</td>
              <td style="padding:6px 4px; border:1px solid #cbd5e1; text-align:right; white-space:nowrap; font-weight:700;">₹${totalExpense.toLocaleString("en-IN")}</td>
            </tr>
          `;
        })
        .join("");

      const reportHTML = `
        <div style="width:1000px; max-width:1000px; box-sizing:border-box; background:#ffffff; color:#111827; font-family:Arial,Helvetica,sans-serif; padding:20px; margin:0;">
          <div style="display:flex; justify-content:space-between; border-bottom:2px solid #111827; padding-bottom:10px; margin-bottom:14px;">
            <div>
              <h1 style="margin:0; font-size:22px;">Vraj Creation</h1>
              <h2 style="margin:4px 0 0; font-size:16px; color:#374151;">Selected Purchase Statement</h2>
              <p style="margin:4px 0 0; font-size:9px; color:#6b7280;">Generated: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
            <div style="text-align:right;">
              <div style="color:#6b7280; font-size:9px;">Selected Records</div>
              <strong style="font-size:16px;">${itemsToExport.length}</strong>
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:9px; line-height:1.3;">
            <colgroup>
              <col style="width:4%;" />
              <col style="width:21%;" />
              <col style="width:12%;" />
              <col style="width:11%;" />
              <col style="width:18%;" />
              <col style="width:7%;" />
              <col style="width:12%;" />
              <col style="width:15%;" />
            </colgroup>
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:6px;border:1px solid #cbd5e1;">#</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Product</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Product ID</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Date</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:left;">Supplier</th>
                <th style="padding:6px;border:1px solid #cbd5e1;">Qty</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:right;">Raw Cost</th>
                <th style="padding:6px;border:1px solid #cbd5e1;text-align:right;">Total Expense</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>

          <div style="margin-top:16px; display:flex; justify-content:flex-end;">
            <table style="width:300px; border-collapse:collapse; font-size:10px;">
              <tbody>
                <tr>
                  <td style="padding:6px;border:1px solid #cbd5e1;">Total Purchase Qty</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;font-weight:700;">${totalQty.toLocaleString("en-IN")} Units</td>
                </tr>
                <tr>
                  <td style="padding:6px;border:1px solid #cbd5e1;">Total Records</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;font-weight:700;">${itemsToExport.length}</td>
                </tr>
                <tr>
                  <td style="padding:6px;border:1px solid #cbd5e1;font-weight:700;">Total Raw Expense</td>
                  <td style="padding:6px;border:1px solid #cbd5e1;text-align:right;font-weight:700;">₹${totalExp.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top:20px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:8px; color:#9ca3af; text-align:center;">
            Vraj Creation • Purchase Management Report
          </div>
        </div>
      `;

      wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-100000px";
      wrapper.style.top = "0";
      wrapper.style.width = "1000px";
      wrapper.style.background = "#fff";
      wrapper.innerHTML = reportHTML;
      document.body.appendChild(wrapper);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const options = {
        margin: [6, 6, 6, 6],
        filename: `Selected_Purchase_Report_${getToday()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1000,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape", compress: true },
        pagebreak: { mode: ["css", "legacy"], avoid: ["tr"] },
      };

      await html2pdf().set(options).from(wrapper.firstElementChild).save();
    } catch (error) {
      console.error("PDF EXPORT ERROR:", error);
      setError("PDF generate nahi ho pa raha. Please try again.");
    } finally {
      if (wrapper) wrapper.remove();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading purchases...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track raw materials, supplier details and purchase costs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95"
          >
            <span>📄</span>
            Export Selected PDF ({selectedIds.length})
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <span>➕</span>
            Add Purchase
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} className="ml-3 font-bold">
            ×
          </button>
        </div>
      )}

      {/* SEARCH */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-lg text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="Search by Product Name, ID or Supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 caret-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:caret-white"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Purchase Statement
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Generated: {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Total Entries / Selected
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {filteredPurchases.length} / <span className="text-red-600">{selectedIds.length}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all filtered purchases"
                    onChange={handleToggleSelectAll}
                    checked={
                      filteredPurchases.length > 0 &&
                      filteredPurchases.every((item) => selectedIds.includes(item._id))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product ID
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Supplier
                </th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Qty
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Raw Cost
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Total Expense
                </th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 text-4xl">📦</div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        No purchase records found
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try another search or add a new purchase entry.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const matchingProd = products.find(p => String(p._id) === String(item.productId));
                  const displayId = matchingProd?.sku || (typeof item.productId === 'string' ? item.productId.slice(-6).toUpperCase() : "-");

                  return (
                    <tr
                      key={item._id}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        selectedIds.includes(item._id) ? "bg-slate-50 dark:bg-slate-800/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.productName || 'product'}`}
                          checked={selectedIds.includes(item._id)}
                          onChange={() => handleToggleSelect(item._id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || DEFAULT_IMAGE}
                            alt={item.productName || "Product"}
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_IMAGE;
                            }}
                            className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-bold text-slate-800 dark:text-slate-100">
                              {item.productName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Entry: {item._id?.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {displayId}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {item.purchaseDate}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {item.supplierName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.rawCost)}
                      </td>
                      <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(calculateTotalPurchaseCost(item))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => handleOpenEditModal(item)}
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(item._id)}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingId ? "Edit Purchase Entry" : "Add Purchase Entry"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editingId ? "Update purchase information" : "Add a new raw material purchase"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                <div className="relative" ref={dropdownRef}>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Product *
                  </label>
                  <input
                    type="text"
                    placeholder="Type to search product (e.g. k)..."
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setIsProductDropdownOpen(true);
                      if (!e.target.value.trim()) {
                        handleSelectProduct(null);
                      }
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    disabled={saving}
                    className={INPUT_CLASS}
                  />

                  {isProductDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      {filteredModalProducts.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-400">
                          No products found
                        </div>
                      ) : (
                        filteredModalProducts.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleSelectProduct(product)}
                            className="cursor-pointer px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <span className="font-bold">{product.name}</span>
                            {product.sku && <span className="text-slate-400"> ({product.sku})</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.image || DEFAULT_IMAGE}
                      alt={selectedProduct.name}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGE;
                      }}
                      className="h-14 w-14 rounded-xl border border-blue-200 object-cover dark:border-blue-900/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {selectedProduct.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedProduct.sku && (
                          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            SKU: {selectedProduct.sku}
                          </span>
                        )}
                        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                          Current Stock:{" "}
                          {Number(selectedProduct.stock || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Product Name
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  readOnly
                  className={`${INPUT_CLASS} cursor-not-allowed bg-slate-100 dark:bg-slate-950`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="supplierName"
                  placeholder="Enter supplier name"
                  value={formData.supplierName}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Purchase Cost / Unit (₹) *
                  </label>
                  <input
                    type="number"
                    name="rawCost"
                    placeholder="250"
                    min="0.01"
                    step="0.01"
                    value={formData.rawCost}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="1"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {Number(formData.rawCost) > 0 && Number(formData.quantity) > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total Purchase Expense
                    </span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(Number(formData.rawCost) * Number(formData.quantity))}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatCurrency(Number(formData.rawCost))} ×{" "}
                    {Number(formData.quantity).toLocaleString("en-IN")} Units
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Purchase Image
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageFileChange}
                  disabled={saving}
                  className={FILE_INPUT_CLASS}
                />
                {formData.productImage && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={formData.productImage}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGE;
                      }}
                      className="h-14 w-14 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-slate-400">
                  JPG, JPEG, PNG or WEBP • Maximum 5 MB
                </p>
              </div>

              {selectedProduct && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        Stock After Purchase
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                        Backend automatically updates Product stock.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {(
                          Number(selectedProduct.stock || 0) +
                          Number(formData.quantity || 0)
                        ).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                        Units
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || products.length === 0}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {saving ? "Saving..." : editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;