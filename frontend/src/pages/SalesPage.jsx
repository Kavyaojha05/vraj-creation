import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/sales";

const SalesPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("meesho");
  const [searchTerm, setSearchTerm] = useState("");
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  const initialFormState = {
    productId: "",
    productName: "",
    productImage: "",
    platform: "meesho",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    bankSettlementAmount: "",
    packagingCost: 0,
    colouringCost: 0,
  };

  const [formData, setFormData] = useState(initialFormState);

  // =========================================================
  // LOAD SALES FROM MONGODB
  // =========================================================
  const loadSales = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const salesData = Array.isArray(data)
        ? data
        : Array.isArray(data.sales)
        ? data.sales
        : [];

      setSales(salesData);
    } catch (error) {
      console.error("LOAD SALES ERROR:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================
  useEffect(() => {
    loadSales(true);

    const interval = setInterval(() => {
      loadSales(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // FILTER
  // =========================================================
  const filteredSales = sales.filter((item) => {
    const platformMatch =
      String(item.platform || "").toLowerCase() ===
      selectedPlatform.toLowerCase();

    const search = searchTerm.toLowerCase().trim();

    const productName = String(item.productName || "").toLowerCase();
    const productId = String(item.productId || "").toLowerCase();

    return (
      platformMatch &&
      (productName.includes(search) || productId.includes(search))
    );
  });

  // =========================================================
  // MARGIN
  // =========================================================
  const calculateMargin = (item) => {
    return (
      Number(item.bankSettlementAmount || 0) -
      Number(item.packagingCost || 0) -
      Number(item.colouringCost || 0)
    );
  };

  const totalSettlement = filteredSales.reduce(
    (acc, item) => acc + Number(item.bankSettlementAmount || 0),
    0
  );

  const totalPackaging = filteredSales.reduce(
    (acc, item) => acc + Number(item.packagingCost || 0),
    0
  );

  const totalColouring = filteredSales.reduce(
    (acc, item) => acc + Number(item.colouringCost || 0),
    0
  );

  const totalNetMargin = filteredSales.reduce(
    (acc, item) => acc + calculateMargin(item),
    0
  );

  const totalQty = filteredSales.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  // =========================================================
  // PRINT
  // =========================================================
  const handlePrintPDF = () => {
    window.print();
  };

  // =========================================================
  // ADD MODAL
  // =========================================================
  const handleOpenAddModal = () => {
    setEditingId(null);

    setFormData({
      ...initialFormState,
      platform: selectedPlatform,
    });

    setIsModalOpen(true);
  };

  // =========================================================
  // EDIT MODAL
  // =========================================================
  const handleOpenEditModal = (item) => {
    setEditingId(item._id);

    setFormData({
      productId: item.productId || "",
      productName: item.productName || "",
      productImage: item.productImage || "",
      platform: item.platform || "meesho",
      date: item.date || new Date().toISOString().split("T")[0],
      quantity: item.quantity || 1,
      bankSettlementAmount: item.bankSettlementAmount || "",
      packagingCost: item.packagingCost || 0,
      colouringCost: item.colouringCost || 0,
    });

    setIsModalOpen(true);
  };

  // =========================================================
  // IMAGE
  // =========================================================
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Prevent very large images
    if (file.size > 5 * 1024 * 1024) {
      alert("Image 5MB se chhoti honi chahiye.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        productImage: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  // =========================================================
  // ADD / UPDATE
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      const payload = {
        productId: String(formData.productId).trim(),
        productName: String(formData.productName).trim(),
        productImage: formData.productImage || "",
        platform: String(formData.platform).toLowerCase(),
        date: formData.date,
        quantity: Number(formData.quantity),
        bankSettlementAmount: Number(formData.bankSettlementAmount),
        packagingCost: Number(formData.packagingCost || 0),
        colouringCost: Number(formData.colouringCost || 0),
      };

      if (!payload.productId || !payload.productName) {
        alert("Product ID aur Product Name required hai.");
        return;
      }

      if (!payload.date) {
        alert("Date select karo.");
        return;
      }

      if (payload.quantity < 1) {
        alert("Quantity kam se kam 1 honi chahiye.");
        return;
      }

      if (payload.bankSettlementAmount < 0) {
        alert("Settlement amount valid hona chahiye.");
        return;
      }

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || `Request failed: ${response.status}`
        );
      }

      // Database se latest data
      await loadSales(false);

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
    } catch (error) {
      console.error("SAVE SALE ERROR:", error);
      alert(error.message || "Sale save nahi ho saki.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap sach me is sale entry ko delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || `Delete failed: ${response.status}`
        );
      }

      await loadSales(false);
    } catch (error) {
      console.error("DELETE SALE ERROR:", error);
      alert(error.message || "Sale delete nahi ho saki.");
    }
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          PRINT CSS
      ===================================================== */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }

          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-table-wrapper {
            overflow: visible !important;
          }

          table {
            width: 100% !important;
            table-layout: fixed !important;
            word-wrap: break-word !important;
          }

          th,
          td {
            padding: 6px 4px !important;
            font-size: 10px !important;
          }

          .print-img {
            display: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Marketplace Sales
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage orders, edits, settlements and profit margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* PLATFORM */}
          <div className="flex rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800">
            {[
              {
                id: "meesho",
                name: "Meesho",
                icon: "🔴",
              },
              {
                id: "amazon",
                name: "Amazon",
                icon: "📦",
              },
              {
                id: "flipkart",
                name: "Flipkart",
                icon: "🟡",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPlatform(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  selectedPlatform === tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* PRINT */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>

          {/* ADD */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <span>➕</span>
            <span>Add Sale Entry</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}
      <div className="no-print flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">

        <span className="text-slate-400">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search by Product Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
        />
      </div>

      {/* =====================================================
          PRINT AREA
      ===================================================== */}
      <div className="print-area space-y-6">

        {/* PRINT HEADER */}
        <div className="hidden border-b border-slate-300 pb-2 print:block">

          <h2 className="text-lg font-black text-slate-900">
            Sales & Margin Report (
            {selectedPlatform.toUpperCase()}
            )
          </h2>

          <p className="text-[10px] text-slate-600">
            Date Generated:{" "}
            {new Date().toLocaleDateString("en-IN")}
          </p>
        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}
        <div className="print-table-wrapper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-slate-300">

          <div className="overflow-x-auto print:overflow-visible">

            <table className="w-full text-left text-xs sm:text-sm">

              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-800">

                <tr>
                  <th className="w-[25%] px-3 py-3 print:w-[22%]">
                    Product
                  </th>

                  <th className="w-[12%] px-3 py-3">
                    Product ID
                  </th>

                  <th className="w-[11%] px-3 py-3">
                    Date
                  </th>

                  <th className="w-[6%] px-2 py-3 text-center">
                    Qty
                  </th>

                  <th className="w-[15%] px-3 py-3">
                    Bank Settlement
                  </th>

                  <th className="w-[10%] px-3 py-3">
                    Packaging
                  </th>

                  <th className="w-[11%] px-3 py-3">
                    Colouring
                  </th>

                  <th className="w-[10%] px-3 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 print:text-emerald-800">
                    Margin
                  </th>

                  <th className="no-print w-[10%] px-3 py-3 text-center">
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 text-center text-slate-400"
                    >
                      Loading sales...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 text-center text-slate-400"
                    >
                      No sales entry found for{" "}
                      {selectedPlatform.toUpperCase()}.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((item) => {
                    const margin = calculateMargin(item);

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >

                        {/* PRODUCT */}
                        <td className="px-3 py-2.5">

                          <div
                            onClick={() =>
                              setPreviewProduct(item)
                            }
                            className="group flex cursor-pointer items-center gap-2"
                            title="Click to Preview Product"
                          >

                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="print-img h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover transition group-hover:scale-105 dark:border-slate-700"
                              />
                            ) : (
                              <div className="print-img flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs dark:border-slate-700 dark:bg-slate-800">
                                🖼️
                              </div>
                            )}

                            <span className="leading-tight font-bold text-slate-800 underline-offset-2 group-hover:text-blue-600 group-hover:underline dark:text-slate-100 dark:group-hover:text-blue-400 print:text-black">
                              {item.productName}
                            </span>

                          </div>

                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 print:text-slate-700">
                          {item.productId}
                        </td>

                        {/* DATE */}
                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
                          {item.date}
                        </td>

                        {/* QTY */}
                        <td className="px-2 py-2.5 text-center font-bold print:text-black">
                          {item.quantity}
                        </td>

                        {/* SETTLEMENT */}
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white print:text-black">
                          ₹
                          {Number(
                            item.bankSettlementAmount || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* PACKAGING */}
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 print:text-slate-700">
                          ₹
                          {Number(
                            item.packagingCost || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* COLOURING */}
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 print:text-slate-700">
                          ₹
                          {Number(
                            item.colouringCost || 0
                          ).toLocaleString("en-IN")}
                        </td>

                        {/* MARGIN */}
                        <td className="px-3 py-2.5 font-black text-emerald-600 dark:text-emerald-400 print:text-emerald-800">
                          ₹
                          {margin.toLocaleString("en-IN")}
                        </td>

                        {/* ACTIONS */}
                        <td className="no-print px-3 py-2.5 text-center">

                          <div className="flex items-center justify-center gap-1">

                            <button
                              onClick={() =>
                                setPreviewProduct(item)
                              }
                              className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                              title="Preview"
                            >
                              👁️
                            </button>

                            <button
                              onClick={() =>
                                handleOpenEditModal(item)
                              }
                              className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                              title="Edit"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(item._id)
                              }
                              className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                              title="Delete"
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

        {/* =====================================================
            SUMMARY
        ===================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white dark:border-slate-800 dark:bg-slate-950 print:border-slate-300 print:bg-slate-100 print:text-black">

          <div className="mb-2 border-b border-slate-800 pb-1.5 print:border-slate-300">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
              {selectedPlatform.toUpperCase()} Total Summary
            </p>

          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5 sm:text-left print:grid-cols-5 print:text-left">

            <div>
              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Qty
              </p>

              <p className="text-sm font-black text-white print:text-black">
                {totalQty} units
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Settlement
              </p>

              <p className="text-sm font-black text-white print:text-black">
                ₹{totalSettlement.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Packaging
              </p>

              <p className="text-sm font-bold text-rose-300 print:text-rose-700">
                − ₹{totalPackaging.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 print:text-slate-600">
                Total Painting
              </p>

              <p className="text-sm font-bold text-rose-300 print:text-rose-700">
                − ₹{totalColouring.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-emerald-800/50 bg-emerald-950/60 p-2 sm:col-span-1 print:col-span-1 print:border-emerald-300 print:bg-emerald-50">

              <p className="text-[10px] font-bold uppercase text-emerald-400 print:text-emerald-800">
                Net Profit
              </p>

              <p className="text-base font-black text-emerald-300 print:text-emerald-900">
                ₹{totalNetMargin.toLocaleString("en-IN")}
              </p>

            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          PRODUCT PREVIEW
      ===================================================== */}
      {previewProduct && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">

              <div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {previewProduct.platform}
                </span>

                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {previewProduct.productId}
                </p>
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                className="rounded-lg p-1 text-xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="space-y-4">

              <div className="flex h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">

                {previewProduct.productImage ? (
                  <img
                    src={previewProduct.productImage}
                    alt={previewProduct.productName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-4xl">
                    🖼️
                  </span>
                )}

              </div>

              <div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {previewProduct.productName}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Order Date: {previewProduct.date}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">

                <div>
                  <span className="text-slate-400">
                    Quantity:
                  </span>

                  <p className="font-bold text-slate-800 dark:text-white">
                    {previewProduct.quantity} units
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">
                    Bank Settlement:
                  </span>

                  <p className="font-bold text-slate-800 dark:text-white">
                    ₹
                    {Number(
                      previewProduct.bankSettlementAmount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">
                    Packaging Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {Number(
                      previewProduct.packagingCost || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">
                    Colouring Cost:
                  </span>

                  <p className="font-medium text-rose-500">
                    ₹
                    {Number(
                      previewProduct.colouringCost || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/40">

                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Net Margin On Sale
                </span>

                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹
                  {calculateMargin(
                    previewProduct
                  ).toLocaleString("en-IN")}
                </span>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}
      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">

              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {editingId
                  ? "Edit Sale Entry"
                  : "Add New Sale Entry"}
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xl font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* PLATFORM + DATE */}
              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Platform
                  </label>

                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="meesho">
                      Meesho
                    </option>

                    <option value="amazon">
                      Amazon
                    </option>

                    <option value="flipkart">
                      Flipkart
                    </option>
                  </select>

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Date
                  </label>

                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* PRODUCT ID + QTY */}
              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Product ID
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="PRD-101"
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productId: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* PRODUCT NAME */}
              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Product Name
                </label>

                <input
                  type="text"
                  required
                  placeholder="Ganesha Idol"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productName: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

              </div>

              {/* IMAGE */}
              <div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Product Image
                </label>

                <div className="mt-1 flex items-center gap-3">

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
                  />

                  {formData.productImage && (
                    <img
                      src={formData.productImage}
                      alt="Preview"
                      className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                  )}

                </div>

              </div>

              {/* AMOUNTS */}
              <div className="grid grid-cols-3 gap-3">

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Bank Settlement (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="1200"
                    value={formData.bankSettlementAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankSettlementAmount:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Packaging (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.packagingCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        packagingCost:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Colouring (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={formData.colouringCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colouringCost:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4">

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Save Entry"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;