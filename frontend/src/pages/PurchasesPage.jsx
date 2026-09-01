import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const API_URL = "http://localhost:5000/api/purchases";

const DEFAULT_IMAGE = "https://via.placeholder.com/80";

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
});

const PurchasePage = () => {
    // ==========================================
    // STATES
    // ==========================================

    const [purchases, setPurchases] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState(createInitialForm());

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    // ==========================================
    // GET PURCHASES FROM MONGODB
    // ==========================================

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(API_URL);

            if (Array.isArray(response.data)) {
                setPurchases(response.data);
            } else {
                setPurchases([]);
            }
        } catch (error) {
            console.error("FETCH PURCHASES ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Purchase data load nahi ho raha."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD DATA WHEN PAGE OPENS
    // ==========================================

    useEffect(() => {
        fetchPurchases();
    }, []);

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredPurchases = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return purchases;
        }

        return purchases.filter((item) => {
            return (
                String(item.productName || "")
                    .toLowerCase()
                    .includes(search) ||

                String(item.productId || "")
                    .toLowerCase()
                    .includes(search) ||

                String(item.supplierName || "")
                    .toLowerCase()
                    .includes(search)
            );
        });
    }, [purchases, searchTerm]);

    // ==========================================
    // CALCULATIONS
    // ==========================================

    const calculateTotalPurchaseCost = (item) => {
        const cost = Number(item.rawCost) || 0;
        const quantity = Number(item.quantity) || 0;

        return cost * quantity;
    };

    const totalPurchaseQty = useMemo(() => {
        return filteredPurchases.reduce(
            (total, item) =>
                total + (Number(item.quantity) || 0),
            0
        );
    }, [filteredPurchases]);

    const totalRawExpense = useMemo(() => {
        return filteredPurchases.reduce(
            (total, item) =>
                total + calculateTotalPurchaseCost(item),
            0
        );
    }, [filteredPurchases]);

    // ==========================================
    // FORMAT CURRENCY
    // ==========================================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN")}`;
    };

    // ==========================================
    // OPEN ADD MODAL
    // ==========================================

    const handleOpenAddModal = () => {
        setEditingId(null);
        setFormData(createInitialForm());
        setError("");
        setIsModalOpen(true);
    };

    // ==========================================
    // OPEN EDIT MODAL
    // ==========================================

    const handleOpenEditModal = (item) => {
        setEditingId(item._id);

        setFormData({
            productId: item.productId || "",
            purchaseDate: item.purchaseDate || getToday(),
            productName: item.productName || "",
            rawCost: item.rawCost ?? "",
            supplierName: item.supplierName || "",
            quantity: item.quantity ?? 1,
            productImage: item.productImage || "",
        });

        setError("");
        setIsModalOpen(true);
    };

    // ==========================================
    // CLOSE MODAL
    // ==========================================

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(createInitialForm());
        setError("");
        setSaving(false);
    };

    // ==========================================
    // INPUT CHANGE
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // IMAGE UPLOAD
    // ==========================================

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size should be less than 2 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setFormData((prev) => ({
                ...prev,
                productImage: reader.result,
            }));

            setError("");
        };

        reader.onerror = () => {
            setError("Unable to read image file.");
        };

        reader.readAsDataURL(file);
    };

    // ==========================================
    // DELETE PURCHASE
    // ==========================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Kya aap is purchase entry ko delete karna chahte hain?"
        );

        if (!confirmed) return;

        try {
            setError("");

            await axios.delete(`${API_URL}/${id}`);

            setPurchases((prev) =>
                prev.filter((item) => item._id !== id)
            );
        } catch (error) {
            console.error("DELETE PURCHASE ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Purchase delete nahi ho pa raha."
            );
        }
    };

    // ==========================================
    // ADD / UPDATE PURCHASE
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const productId = formData.productId.trim();

        const productName =
            formData.productName.trim();

        const supplierName =
            formData.supplierName.trim();

        const rawCost = Number(formData.rawCost);

        const quantity = Number(formData.quantity);

        // ======================================
        // VALIDATION
        // ======================================

        if (!productId || !productName || !supplierName) {
            setError("Please fill all required fields.");
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

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            setError(
                "Quantity must be a whole number greater than 0."
            );
            return;
        }

        const purchaseData = {
            productId,
            purchaseDate: formData.purchaseDate,
            productName,
            rawCost,
            supplierName,
            quantity,
            productImage: formData.productImage || "",
        };

        try {
            setSaving(true);

            // ======================================
            // UPDATE
            // ======================================

            if (editingId) {
                const response = await axios.put(
                    `${API_URL}/${editingId}`,
                    purchaseData
                );

                const updatedPurchase =
                    response.data.purchase;

                setPurchases((prev) =>
                    prev.map((item) =>
                        item._id === editingId
                            ? updatedPurchase
                            : item
                    )
                );
            }

            // ======================================
            // CREATE
            // ======================================

            else {
                const response = await axios.post(
                    API_URL,
                    purchaseData
                );

                const newPurchase =
                    response.data.purchase;

                setPurchases((prev) => [
                    newPurchase,
                    ...prev,
                ]);
            }

            handleCloseModal();
        } catch (error) {
            console.error("SAVE PURCHASE ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Purchase save nahi ho pa raha."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // PDF EXPORT
    // ==========================================

    const handleDownloadPDF = async () => {
        if (!filteredPurchases.length) {
            setError(
                "PDF export ke liye koi purchase record nahi hai."
            );

            return;
        }

        try {
            setError("");

            const reportRows = filteredPurchases
                .map(
                    (item, index) => `
                        <tr>
                            <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">
                                ${index + 1}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;">
                                ${item.productName || "-"}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;">
                                ${item.productId || "-"}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;">
                                ${item.purchaseDate || "-"}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;">
                                ${item.supplierName || "-"}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;">
                                ${Number(item.quantity || 0)}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;text-align:right;">
                                ₹${Number(
                                    item.rawCost || 0
                                ).toLocaleString("en-IN")}
                            </td>

                            <td style="padding:8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">
                                ₹${calculateTotalPurchaseCost(
                                    item
                                ).toLocaleString("en-IN")}
                            </td>
                        </tr>
                    `
                )
                .join("");

            const reportHTML = `
                <div
                    style="
                        width:1100px;
                        background:#ffffff;
                        color:#111827;
                        font-family:Arial,Helvetica,sans-serif;
                        padding:30px;
                        box-sizing:border-box;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            border-bottom:2px solid #111827;
                            padding-bottom:15px;
                            margin-bottom:20px;
                        "
                    >

                        <div>
                            <h1
                                style="
                                    margin:0;
                                    font-size:26px;
                                    font-weight:700;
                                "
                            >
                                Vraj Creation
                            </h1>

                            <h2
                                style="
                                    margin:6px 0 0;
                                    font-size:20px;
                                    color:#374151;
                                "
                            >
                                Purchase Statement
                            </h2>

                            <p
                                style="
                                    margin:6px 0 0;
                                    font-size:12px;
                                    color:#6b7280;
                                "
                            >
                                Generated:
                                ${new Date().toLocaleDateString(
                                    "en-IN"
                                )}
                            </p>
                        </div>

                        <div
                            style="
                                text-align:right;
                                font-size:13px;
                            "
                        >
                            <div style="color:#6b7280;">
                                Total Records
                            </div>

                            <strong
                                style="
                                    font-size:20px;
                                "
                            >
                                ${filteredPurchases.length}
                            </strong>
                        </div>

                    </div>

                    <table
                        style="
                            width:100%;
                            border-collapse:collapse;
                            table-layout:fixed;
                            font-size:11px;
                        "
                    >

                        <thead>
                            <tr
                                style="
                                    background:#f1f5f9;
                                "
                            >

                                <th
                                    style="
                                        width:5%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                    "
                                >
                                    #
                                </th>

                                <th
                                    style="
                                        width:20%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:left;
                                    "
                                >
                                    Product
                                </th>

                                <th
                                    style="
                                        width:11%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:left;
                                    "
                                >
                                    Product ID
                                </th>

                                <th
                                    style="
                                        width:11%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:left;
                                    "
                                >
                                    Date
                                </th>

                                <th
                                    style="
                                        width:18%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:left;
                                    "
                                >
                                    Supplier
                                </th>

                                <th
                                    style="
                                        width:8%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                    "
                                >
                                    Qty
                                </th>

                                <th
                                    style="
                                        width:12%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:right;
                                    "
                                >
                                    Raw Cost
                                </th>

                                <th
                                    style="
                                        width:15%;
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:right;
                                    "
                                >
                                    Total Expense
                                </th>

                            </tr>
                        </thead>

                        <tbody>
                            ${reportRows}
                        </tbody>

                    </table>

                    <div
                        style="
                            margin-top:20px;
                            display:flex;
                            justify-content:flex-end;
                        "
                    >

                        <table
                            style="
                                width:320px;
                                border-collapse:collapse;
                                font-size:12px;
                            "
                        >

                            <tr>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        font-weight:600;
                                    "
                                >
                                    Total Purchase Qty
                                </td>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:right;
                                        font-weight:700;
                                    "
                                >
                                    ${totalPurchaseQty.toLocaleString(
                                        "en-IN"
                                    )} Units
                                </td>

                            </tr>

                            <tr>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        font-weight:600;
                                    "
                                >
                                    Total Records
                                </td>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:right;
                                        font-weight:700;
                                    "
                                >
                                    ${filteredPurchases.length}
                                </td>

                            </tr>

                            <tr>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        font-weight:700;
                                    "
                                >
                                    Total Raw Expense
                                </td>

                                <td
                                    style="
                                        padding:9px;
                                        border:1px solid #cbd5e1;
                                        text-align:right;
                                        font-weight:700;
                                    "
                                >
                                    ₹${totalRawExpense.toLocaleString(
                                        "en-IN"
                                    )}
                                </td>

                            </tr>

                        </table>

                    </div>

                    <div
                        style="
                            margin-top:30px;
                            padding-top:12px;
                            border-top:1px solid #e5e7eb;
                            font-size:9px;
                            color:#9ca3af;
                            text-align:center;
                        "
                    >
                        Vraj Creation • Purchase Management Report
                    </div>

                </div>
            `;

            const wrapper =
                document.createElement("div");

            wrapper.style.position = "fixed";
            wrapper.style.left = "-100000px";
            wrapper.style.top = "0";
            wrapper.style.width = "1100px";
            wrapper.style.background = "#ffffff";
            wrapper.innerHTML = reportHTML;

            document.body.appendChild(wrapper);

            const element =
                wrapper.firstElementChild;

            await new Promise((resolve) =>
                setTimeout(resolve, 300)
            );

            const options = {
                margin: 8,

                filename: `Purchase_Report_${new Date()
                    .toISOString()
                    .split("T")[0]}.pdf`,

                image: {
                    type: "jpeg",
                    quality: 0.98,
                },

                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                },

                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "landscape",
                },

                pagebreak: {
                    mode: ["css", "legacy"],
                },
            };

            await html2pdf()
                .set(options)
                .from(element)
                .save();

            wrapper.remove();
        } catch (error) {
            console.error(
                "PDF EXPORT ERROR:",
                error
            );

            const oldWrapper =
                document.querySelector(
                    "#purchase-pdf-report"
                );

            if (oldWrapper) {
                oldWrapper.remove();
            }

            setError(
                "PDF generate nahi ho pa raha. Please try again."
            );
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Loading purchases...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="space-y-6">

            {/* =====================================
                HEADER
            ====================================== */}

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
                        Export PDF
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

            {/* =====================================
                ERROR
            ====================================== */}

            {error && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">

                    <span>
                        ⚠️ {error}
                    </span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="ml-3 font-bold"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* =====================================
                SEARCH
            ====================================== */}

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <span className="text-lg text-slate-400">
                    🔍
                </span>

                <input
                    type="text"
                    placeholder="Search by Product Name, ID or Supplier..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
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

            {/* =====================================
                TABLE
            ====================================== */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

                    <div>

                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                            Purchase Statement
                        </h2>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Generated:{" "}
                            {new Date().toLocaleDateString(
                                "en-IN"
                            )}
                        </p>

                    </div>

                    <div className="text-left sm:text-right">

                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Total Entries
                        </p>

                        <p className="text-lg font-black text-slate-900 dark:text-white">
                            {filteredPurchases.length}
                        </p>

                    </div>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px] text-left text-sm">

                        <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">

                            <tr>

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

                                    <td
                                        colSpan={8}
                                        className="px-4 py-16 text-center"
                                    >

                                        <div className="flex flex-col items-center justify-center">

                                            <div className="mb-3 text-4xl">
                                                📦
                                            </div>

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

                                filteredPurchases.map(
                                    (item) => (

                                        <tr
                                            key={item._id}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        >

                                            {/* PRODUCT */}

                                            <td className="px-4 py-3">

                                                <div className="flex items-center gap-3">

                                                    <img
                                                        src={
                                                            item.productImage ||
                                                            DEFAULT_IMAGE
                                                        }
                                                        alt={
                                                            item.productName
                                                        }
                                                        onError={(
                                                            e
                                                        ) => {
                                                            e.currentTarget.src =
                                                                DEFAULT_IMAGE;
                                                        }}
                                                        className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                                                    />

                                                    <div className="min-w-0">

                                                        <p className="max-w-[220px] truncate font-bold text-slate-800 dark:text-slate-100">
                                                            {
                                                                item.productName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                                            ID:{" "}
                                                            {item._id
                                                                ?.slice(
                                                                    -6
                                                                )
                                                                .toUpperCase()}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* PRODUCT ID */}

                                            <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                {item.productId}
                                            </td>

                                            {/* DATE */}

                                            <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                {item.purchaseDate}
                                            </td>

                                            {/* SUPPLIER */}

                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                {item.supplierName}
                                            </td>

                                            {/* QTY */}

                                            <td className="px-4 py-3 text-center">

                                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {item.quantity}
                                                </span>

                                            </td>

                                            {/* RAW COST */}

                                            <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                                                {formatCurrency(
                                                    item.rawCost
                                                )}
                                            </td>

                                            {/* TOTAL */}

                                            <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400">
                                                {formatCurrency(
                                                    calculateTotalPurchaseCost(
                                                        item
                                                    )
                                                )}
                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-4 py-3 text-center">

                                                <div className="flex items-center justify-center gap-2">

                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() =>
                                                            handleOpenEditModal(
                                                                item
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                item._id
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                    >
                                                        🗑️
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

                {/* =================================
                    SUMMARY
                ================================== */}

                <div className="border-t border-slate-200 p-5 dark:border-slate-800">

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">

                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                Total Purchase Qty
                            </p>

                            <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">

                                {totalPurchaseQty.toLocaleString(
                                    "en-IN"
                                )}

                                <span className="ml-1 text-xs font-bold text-slate-400">
                                    Units
                                </span>

                            </p>

                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">

                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                Total Records
                            </p>

                            <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                                {filteredPurchases.length}
                            </p>

                        </div>

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">

                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                Total Raw Expense
                            </p>

                            <p className="mt-1 text-xl font-black text-blue-600 dark:text-blue-400">
                                {formatCurrency(
                                    totalRawExpense
                                )}
                            </p>

                        </div>

                    </div>

                </div>

            </div>

            {/* =====================================
                MODAL
            ====================================== */}

            {isModalOpen && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            handleCloseModal();
                        }
                    }}
                >

                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">

                        {/* MODAL HEADER */}

                        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">

                            <div>

                                <h2 className="text-lg font-black text-slate-900 dark:text-white">

                                    {editingId
                                        ? "Edit Purchase Entry"
                                        : "Add Purchase Entry"}

                                </h2>

                                <p className="mt-1 text-xs text-slate-400">

                                    {editingId
                                        ? "Update purchase information"
                                        : "Add a new raw material purchase"}

                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >

                            {/* PRODUCT ID + DATE */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>

                                    <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Product ID *
                                    </label>

                                    <input
                                        type="text"
                                        name="productId"
                                        placeholder="PRD-001"
                                        value={
                                            formData.productId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
                                    />

                                </div>

                                <div>

                                    <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Purchase Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        value={
                                            formData.purchaseDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
                                    />

                                </div>

                            </div>

                            {/* PRODUCT NAME */}

                            <div>

                                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                    Product Name *
                                </label>

                                <input
                                    type="text"
                                    name="productName"
                                    placeholder="Enter product name"
                                    value={
                                        formData.productName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
                                />

                            </div>

                            {/* SUPPLIER */}

                            <div>

                                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                    Supplier Name *
                                </label>

                                <input
                                    type="text"
                                    name="supplierName"
                                    placeholder="Enter supplier name"
                                    value={
                                        formData.supplierName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
                                />

                            </div>

                            {/* COST + QUANTITY */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>

                                    <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Raw Cost (₹) *
                                    </label>

                                    <input
                                        type="number"
                                        name="rawCost"
                                        placeholder="250"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            formData.rawCost
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
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
                                        value={
                                            formData.quantity
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
                                    />

                                </div>

                            </div>

                            {/* IMAGE */}

                            <div>

                                <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                    Product Image
                                </label>

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={
                                        handleImageFileChange
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:file:bg-slate-700 dark:file:text-white"
                                />

                                {formData.productImage && (

                                    <div className="mt-3 flex items-center gap-3">

                                        <img
                                            src={
                                                formData.productImage
                                            }
                                            alt="Preview"
                                            className="h-14 w-14 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        productImage:
                                                            "",
                                                    })
                                                )
                                            }
                                            className="text-xs font-bold text-rose-600 hover:underline"
                                        >
                                            Remove Image
                                        </button>

                                    </div>

                                )}

                            </div>

                            {/* ERROR */}

                            {error && (

                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                    ⚠️ {error}
                                </div>

                            )}

                            {/* BUTTONS */}

                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">

                                <button
                                    type="button"
                                    onClick={
                                        handleCloseModal
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >

                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Record"
                                            : "Save Record"}

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