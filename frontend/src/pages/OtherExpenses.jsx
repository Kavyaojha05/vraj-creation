// =====================================================
// VRAJ CREATION - OTHER EXPENSES
// Completely Independent Module
// =====================================================

import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiSave,
  FiImage,
  FiCalendar,
  FiFileText,
  FiEdit,
  FiUpload,
} from "react-icons/fi";

// =====================================================
// API
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
  productId: "",
  productName: "",
  supplierName: "",
  purchaseDate: "",
  purchaseCost: "",
  quantity: "1",
  purchaseImage: "",
};

// =====================================================
// COMPONENT
// =====================================================

const OtherExpenses = () => {
  // ---------------------------------------------------
  // DATA
  // ---------------------------------------------------

  const [expenses, setExpenses] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  const [search, setSearch] =
    useState("");

  // ---------------------------------------------------
  // MODAL
  // ---------------------------------------------------

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  // ---------------------------------------------------
  // FORM
  // ---------------------------------------------------

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  // ---------------------------------------------------
  // IMAGE
  // ---------------------------------------------------

  const [imageFile, setImageFile] =
    useState(null);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  // ---------------------------------------------------
  // SELECTED RECORDS
  // ---------------------------------------------------

  const [
    selectedExpenses,
    setSelectedExpenses,
  ] = useState([]);

  // ---------------------------------------------------
  // FETCH
  // ---------------------------------------------------

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const response =
        await axios.get(
          `${API_BASE_URL}/other-expenses`
        );

      if (response.data?.success) {
        setExpenses(
          response.data.data || []
        );
      }
    } catch (error) {
      console.error(
        "Fetch Other Expenses Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to fetch other expenses."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ===================================================
  // SEARCH FILTER
  // ===================================================

  const filteredExpenses =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return expenses;
      }

      return expenses.filter((item) => {
        return (
          item.productId
            ?.toLowerCase()
            .includes(value) ||
          item.productName
            ?.toLowerCase()
            .includes(value) ||
          item.supplierName
            ?.toLowerCase()
            .includes(value)
        );
      });
    }, [expenses, search]);

  // ===================================================
  // TOTAL
  // ===================================================

  const totalAmount = useMemo(() => {
    return expenses.reduce(
      (total, item) => {
        return (
          total +
          Number(item.purchaseCost || 0) *
            Number(item.quantity || 0)
        );
      },
      0
    );
  }, [expenses]);

  // ===================================================
  // SELECTED TOTAL
  // ===================================================

  const selectedTotal = useMemo(() => {
    return selectedExpenses.reduce(
      (total, id) => {
        const item =
          expenses.find(
            (expense) =>
              expense._id === id
          );

        if (!item) {
          return total;
        }

        return (
          total +
          Number(
            item.purchaseCost || 0
          ) *
            Number(item.quantity || 0)
        );
      },
      0
    );
  }, [
    selectedExpenses,
    expenses,
  ]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      ...EMPTY_FORM,

      purchaseDate:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setImageFile(null);

    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (
    expense
  ) => {
    setEditingId(expense._id);

    setFormData({
      productId:
        expense.productId || "",

      productName:
        expense.productName || "",

      supplierName:
        expense.supplierName || "",

      purchaseDate:
        expense.purchaseDate
          ? new Date(
              expense.purchaseDate
            )
              .toISOString()
              .split("T")[0]
          : "",

      purchaseCost:
        expense.purchaseCost !==
          undefined &&
        expense.purchaseCost !==
          null
          ? String(
              expense.purchaseCost
            )
          : "",

      quantity:
        expense.quantity !==
          undefined &&
        expense.quantity !==
          null
          ? String(
              expense.quantity
            )
          : "1",

      purchaseImage:
        expense.purchaseImage || "",
    });

    setImageFile(null);

    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (uploadingImage) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setFormData(EMPTY_FORM);

    setImageFile(null);
  };

  // ===================================================
  // IMAGE SELECT
  // ===================================================

  const handleImageSelect = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    // -----------------------------------------------
    // File type
    // -----------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      e.target.value = "";

      return;
    }

    // -----------------------------------------------
    // File size
    // -----------------------------------------------

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";

      return;
    }

    setImageFile(file);
  };

  // ===================================================
  // UPLOAD IMAGE TO CLOUDINARY
  // ===================================================

  const uploadImage = async () => {
    if (!imageFile) {
      return formData.purchaseImage;
    }

    try {
      setUploadingImage(true);

      const data =
        new FormData();

      data.append(
        "image",
        imageFile
      );

      const response =
        await axios.post(
          `${API_BASE_URL}/other-expenses/upload-image`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Image upload failed."
        );
      }

      return (
        response.data.data
          ?.imageUrl || ""
      );
    } catch (error) {
      console.error(
        "Image Upload Error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          error.message ||
          "Failed to upload image."
      );

      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (
      !formData.supplierName.trim()
    ) {
      alert(
        "Supplier Name is required."
      );

      return;
    }

    if (
      !formData.purchaseDate
    ) {
      alert(
        "Purchase Date is required."
      );

      return;
    }

    if (
      formData.purchaseCost ===
        "" ||
      Number(
        formData.purchaseCost
      ) < 0
    ) {
      alert(
        "Enter a valid Purchase Cost."
      );

      return;
    }

    if (
      formData.quantity ===
        "" ||
      Number(
        formData.quantity
      ) <= 0
    ) {
      alert(
        "Enter a valid Quantity."
      );

      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------
      // Upload image ONLY if new image selected
      // ------------------------------------------------

      let imageUrl =
        formData.purchaseImage;

      if (imageFile) {
        imageUrl =
          await uploadImage();
      }

      // ------------------------------------------------
      // Payload
      // ------------------------------------------------

      const payload = {
        productId:
          formData.productId.trim(),

        productName:
          formData.productName.trim(),

        supplierName:
          formData.supplierName.trim(),

        purchaseDate:
          formData.purchaseDate,

        purchaseCost:
          Number(
            formData.purchaseCost
          ),

        quantity:
          Number(
            formData.quantity
          ),

        purchaseImage:
          imageUrl || "",
      };

      // ------------------------------------------------
      // EDIT
      // ------------------------------------------------

      if (editingId) {
        const response =
          await axios.put(
            `${API_BASE_URL}/other-expenses/${editingId}`,
            payload
          );

        if (
          response.data?.success
        ) {
          alert(
            "Other Expense updated successfully."
          );
        }
      }

      // ------------------------------------------------
      // ADD
      // ------------------------------------------------

      else {
        const response =
          await axios.post(
            `${API_BASE_URL}/other-expenses`,
            payload
          );

        if (
          response.data?.success
        ) {
          alert(
            "Other Expense saved successfully."
          );
        }
      }

      // ------------------------------------------------
      // Reset
      // ------------------------------------------------

      closeModal();

      await fetchExpenses();
    } catch (error) {
      console.error(
        "Save Other Expense Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to save other expense."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (
    id
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this Other Expense?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.delete(
          `${API_BASE_URL}/other-expenses/${id}`
        );

      if (
        response.data?.success
      ) {
        setSelectedExpenses(
          (prev) =>
            prev.filter(
              (item) => item !== id
            )
        );

        alert(
          "Other Expense deleted successfully."
        );

        await fetchExpenses();
      }
    } catch (error) {
      console.error(
        "Delete Other Expense Error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete other expense."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CHECKBOX
  // ===================================================

  const toggleSelection = (
    id
  ) => {
    setSelectedExpenses(
      (prev) => {
        if (prev.includes(id)) {
          return prev.filter(
            (item) => item !== id
          );
        }

        return [...prev, id];
      }
    );
  };

  // ===================================================
  // SELECT ALL
  // ===================================================

  const allFilteredSelected =
    filteredExpenses.length >
      0 &&
    filteredExpenses.every(
      (item) =>
        selectedExpenses.includes(
          item._id
        )
    );

  const toggleSelectAll = () => {
    if (
      allFilteredSelected
    ) {
      setSelectedExpenses(
        (prev) =>
          prev.filter(
            (id) =>
              !filteredExpenses.some(
                (item) =>
                  item._id === id
              )
          )
      );
    } else {
      setSelectedExpenses(
        (prev) => {
          const ids =
            filteredExpenses.map(
              (item) =>
                item._id
            );

          return Array.from(
            new Set([
              ...prev,
              ...ids,
            ])
          );
        }
      );
    }
  };

  // ===================================================
  // EXPORT SELECTED PDF
  // ===================================================

  const exportSelectedPDF = () => {
    if (
      selectedExpenses.length ===
      0
    ) {
      alert(
        "Please select at least one record."
      );

      return;
    }

    const selectedData =
      expenses.filter(
        (item) =>
          selectedExpenses.includes(
            item._id
          )
      );

    const rows =
      selectedData
        .map((item, index) => {
          const total =
            Number(
              item.purchaseCost || 0
            ) *
            Number(
              item.quantity || 0
            );

          const date = item
            .purchaseDate
            ? new Date(
                item.purchaseDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "-";

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${date}</td>
              <td>${item.productId || "-"}</td>
              <td>${item.productName || "-"}</td>
              <td>${item.supplierName || "-"}</td>
              <td>₹${Number(
                item.purchaseCost || 0
              ).toFixed(2)}</td>
              <td>${item.quantity || 0}</td>
              <td>₹${total.toFixed(
                2
              )}</td>
            </tr>
          `;
        })
        .join("");

    const total =
      selectedData.reduce(
        (sum, item) =>
          sum +
          Number(
            item.purchaseCost || 0
          ) *
            Number(
              item.quantity || 0
            ),
        0
      );

    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      alert(
        "Please allow popups to export PDF."
      );

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            Vraj Creation - Other Expenses
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #222;
            }

            h1 {
              margin: 0;
              font-size: 24px;
            }

            .subtitle {
              margin-top: 6px;
              color: #666;
              font-size: 13px;
            }

            .summary {
              margin-top: 20px;
              margin-bottom: 20px;
              display: flex;
              gap: 30px;
            }

            .summary-box {
              border: 1px solid #ddd;
              padding: 12px 18px;
              border-radius: 8px;
            }

            .summary-label {
              font-size: 12px;
              color: #666;
            }

            .summary-value {
              margin-top: 5px;
              font-size: 18px;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 8px;
              font-size: 11px;
              text-align: left;
            }

            th {
              background: #f3f3f3;
              font-weight: bold;
            }

            .total {
              margin-top: 20px;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
            }

            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>

        <body>

          <h1>
            Vraj Creation
          </h1>

          <div class="subtitle">
            Other Expenses Report
          </div>

          <div class="summary">

            <div class="summary-box">
              <div class="summary-label">
                Selected Records
              </div>

              <div class="summary-value">
                ${selectedData.length}
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-label">
                Selected Total
              </div>

              <div class="summary-value">
                ₹${total.toFixed(2)}
              </div>
            </div>

          </div>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Supplier</th>
                <th>Cost / Unit</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <div class="total">
            Grand Total: ₹${total.toFixed(
              2
            )}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>

        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN"
    );
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Other Expenses
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your independent other expenses
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {selectedExpenses.length >
            0 && (
            <button
              onClick={
                exportSelectedPDF
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
            >
              <FiFileText />

              Export Selected PDF (
              {
                selectedExpenses.length
              }
              )
            </button>
          )}

          <button
            onClick={
              openAddModal
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            <FiPlus />

            Add Other Expense
          </button>

        </div>

      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Records
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {expenses.length}
          </p>

        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Expense
          </p>

          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ₹
            {totalAmount.toFixed(
              2
            )}
          </p>

        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selected Total
          </p>

          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            ₹
            {selectedTotal.toFixed(
              2
            )}
          </p>

        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">

        <div className="relative max-w-md">

          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search product, supplier..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-gray-50 dark:bg-gray-800">

              <tr>

                <th className="px-4 py-3 text-center">

                  <input
                    type="checkbox"
                    checked={
                      allFilteredSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                    className="w-4 h-4"
                  />

                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Image
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Date
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Product ID
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Product Name
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Supplier
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Cost / Unit
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Qty
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Total
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

              {loading &&
                expenses.length ===
                  0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredExpenses.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No Other Expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(
                  (item) => {
                    const rowTotal =
                      Number(
                        item.purchaseCost ||
                          0
                      ) *
                      Number(
                        item.quantity ||
                          0
                      );

                    return (
                      <tr
                        key={
                          item._id
                        }
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >

                        {/* CHECKBOX */}

                        <td className="px-4 py-3 text-center">

                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(
                              item._id
                            )}
                            onChange={() =>
                              toggleSelection(
                                item._id
                              )
                            }
                            className="w-4 h-4"
                          />

                        </td>

                        {/* IMAGE */}

                        <td className="px-4 py-3">

                          {item.purchaseImage ? (
                            <img
                              src={
                                item.purchaseImage
                              }
                              alt={
                                item.productName ||
                                "Expense"
                              }
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                              <FiImage />
                            </div>
                          )}

                        </td>

                        {/* DATE */}

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(
                            item.purchaseDate
                          )}
                        </td>

                        {/* PRODUCT ID */}

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {item.productId ||
                            "-"}
                        </td>

                        {/* PRODUCT NAME */}

                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {item.productName ||
                            "-"}
                        </td>

                        {/* SUPPLIER */}

                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {
                            item.supplierName
                          }
                        </td>

                        {/* COST */}

                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          ₹
                          {Number(
                            item.purchaseCost ||
                              0
                          ).toFixed(2)}
                        </td>

                        {/* QTY */}

                        <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                          {
                            item.quantity
                          }
                        </td>

                        {/* TOTAL */}

                        <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900 dark:text-white">
                          ₹
                          {rowTotal.toFixed(
                            2
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-3">

                          <div className="flex items-center justify-center gap-2">

                            <button
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  item._id
                                )
                              }
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* OVERLAY */}

          <div
            className="absolute inset-0 bg-black/60"
            onClick={
              closeModal
            }
          />

          {/* MODAL */}

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingId
                    ? "Edit Other Expense"
                    : "Add Other Expense"}
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This module is completely independent.
                </p>

              </div>

              <button
                onClick={
                  closeModal
                }
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <FiX size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6 space-y-5"
            >

              {/* PRODUCT ID */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product ID
                  <span className="text-xs text-gray-400 ml-2">
                    Optional
                  </span>
                </label>

                <input
                  type="text"
                  name="productId"
                  value={
                    formData.productId
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Product ID"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* PRODUCT NAME */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name
                </label>

                <input
                  type="text"
                  name="productName"
                  value={
                    formData.productName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Product Name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* SUPPLIER */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier Name *
                </label>

                <input
                  type="text"
                  name="supplierName"
                  value={
                    formData.supplierName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter Supplier Name"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* DATE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date *
                </label>

                <div className="relative">

                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

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
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              {/* COST + QTY */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Cost / Unit (₹) *
                  </label>

                  <input
                    type="number"
                    name="purchaseCost"
                    value={
                      formData.purchaseCost
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    step="1"
                    required
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              {/* IMAGE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Image
                </label>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5">

                  <div className="flex flex-col md:flex-row gap-5 items-center">

                    {/* PREVIEW */}

                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">

                      {imageFile ? (
                        <img
                          src={URL.createObjectURL(
                            imageFile
                          )}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : formData.purchaseImage ? (
                        <img
                          src={
                            formData.purchaseImage
                          }
                          alt="Current"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiImage
                          size={32}
                          className="text-gray-400"
                        />
                      )}

                    </div>

                    {/* UPLOAD */}

                    <div className="flex-1">

                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white cursor-pointer transition">

                        <FiUpload />

                        Choose Image

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={
                            handleImageSelect
                          }
                          className="hidden"
                        />

                      </label>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        JPG, JPEG, PNG or WEBP
                        • Maximum 5 MB
                      </p>

                      {imageFile && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          New image selected:
                          {" "}
                          {
                            imageFile.name
                          }
                        </p>
                      )}

                      {formData.purchaseImage &&
                        !imageFile && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Existing Cloudinary image will be kept.
                          </p>
                        )}

                    </div>

                  </div>

                </div>

              </div>

              {/* TOTAL PREVIEW */}

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total Expense
                  </span>

                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹
                    {(
                      Number(
                        formData.purchaseCost ||
                          0
                      ) *
                      Number(
                        formData.quantity ||
                          0
                      )
                    ).toFixed(2)}
                  </span>

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    uploadingImage
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                >
                  <FiX />

                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    uploadingImage
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {uploadingImage ? (
                    <>
                      <span className="animate-spin">
                        ⏳
                      </span>

                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiSave />

                      {editingId
                        ? "Update Record"
                        : "Save Record"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default OtherExpenses;