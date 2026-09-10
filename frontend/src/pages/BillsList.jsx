import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// NUMBER TO WORDS - INDIAN CURRENCY
// =====================================================
const convertNumberToWords = (amount) => {
  const numAmount = Number(amount);

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return "Rupees Zero Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigit = (value) => {
    if (value === 0) return "";
    if (value < 20) return ones[value];
    return (
      tens[Math.floor(value / 10)] +
      (value % 10 ? ` ${ones[value % 10]}` : "")
    );
  };

  const inWords = (value) => {
    value = Math.floor(value);
    if (value === 0) return "";

    let result = "";
    const crore = Math.floor(value / 10000000);
    value %= 10000000;

    const lakh = Math.floor(value / 100000);
    value %= 100000;

    const thousand = Math.floor(value / 1000);
    value %= 1000;

    const hundred = Math.floor(value / 100);
    const rest = value % 100;

    if (crore > 0) result += `${twoDigit(crore)} Crore `;
    if (lakh > 0) result += `${twoDigit(lakh)} Lakh `;
    if (thousand > 0) result += `${twoDigit(thousand)} Thousand `;
    if (hundred > 0) result += `${ones[hundred]} Hundred `;
    if (rest > 0) {
      if (result.trim() !== "") result += "and ";
      result += twoDigit(rest);
    }

    return result.trim();
  };

  const [wholePart, decimalPart] = numAmount.toFixed(2).split(".");
  const whole = Number(wholePart);
  const decimal = Number(decimalPart);

  let result = `Rupees ${inWords(whole)}`;
  if (decimal > 0) {
    result += ` and ${inWords(decimal)} Paise`;
  }

  return `${result} Only`;
};

// =====================================================
// SAFE NUMBER
// =====================================================
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// =====================================================
// FORMAT MONEY
// =====================================================
const money = (value) => {
  return num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// ESCAPE HTML
// =====================================================
const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// =====================================================
// GST CALCULATION (Calculating CGST, SGST and IGST as sum of both)
// =====================================================
const calculateGST = (items, customerStateCode) => {
  let taxableTotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  const stateStr = String(customerStateCode || "").trim();
  const isRajasthan = stateStr === "" || stateStr === "08";

  items.forEach((item) => {
    const quantity = num(item.quantity);
    const price = num(item.price);
    const itemDiscount = num(item.discount);
    const gstRate = num(item.gstRate) || 5;

    const gross = quantity * price;
    const taxable = Math.max(0, gross - itemDiscount);

    taxableTotal += taxable;

    if (isRajasthan) {
      const cgst = (taxable * (gstRate / 2)) / 100;
      const sgst = (taxable * (gstRate / 2)) / 100;
      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      // For interstate, splitting the 5% total tax equally into 2.5% CGST and 2.5% SGST equivalent calculation base
      const cgst = (taxable * (gstRate / 2)) / 100;
      const sgst = (taxable * (gstRate / 2)) / 100;
      totalCGST += cgst;
      totalSGST += sgst;
    }
  });

  // IGST is total of CGST and SGST
  const totalIGST = totalCGST + totalSGST;
  const totalGST = isRajasthan ? (totalCGST + totalSGST) : totalIGST;

  return {
    taxableTotal,
    totalCGST,
    totalSGST,
    totalIGST,
    totalGST,
    isRajasthan,
  };
};

// =====================================================
// COMPONENT
// =====================================================
const BillsList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/bills");
      const data = response.data;

      if (Array.isArray(data?.bills)) {
        setBills(data.bills);
      } else if (Array.isArray(data)) {
        setBills(data);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError(err.response?.data?.message || "Failed to load bills list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDeleteBill = async (bill) => {
    const id = bill._id || bill.id;
    const billNo = bill.invoiceNo || bill.billNumber || "this bill";

    if (!id) {
      alert("Bill ID not found.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${billNo}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      await api.delete(`/bills/${id}`);
      setBills((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.error("Delete bill error:", err);
      setError(err.response?.data?.message || "Failed to delete bill.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditBill = (bill) => {
    const id = bill._id || bill.id;
    if (!id) {
      alert("Bill ID not found.");
      return;
    }
    navigate(`/edit-bill/${id}`);
  };

  const handlePrintBill = (bill) => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this website.");
      return;
    }

    const items = Array.isArray(bill.items) ? bill.items : [];
    const invoiceNo = bill.invoiceNo || bill.billNumber || "-";
    const invoiceDate = bill.invoiceDate || bill.createdAt;
    const formattedDate = invoiceDate
      ? new Date(invoiceDate).toLocaleDateString("en-IN")
      : "-";

    const customer = bill.customer || {};
    const customerName = customer.name || bill.customerName || "Walk-in Customer";
    const customerAddress = customer.billingAddress || customer.address || bill.billingAddress || "";
    const customerShippingAddress = customer.shippingAddress || customerAddress || "";
    const customerPhone = customer.phone || bill.customerPhone || "";
    const customerGST = customer.gstin || customer.gstIn || bill.customerGSTIN || "";
    const customerPincode = customer.pincode || bill.pincode || "";
    const customerCity = customer.city || bill.city || "";
    const customerState = customer.state || bill.state || "";
    const customerStateCode = customer.stateCode || bill.stateCode || "";

    const placeOfSupply =
      customerState
        ? `${customerState}${customerStateCode ? ` (${customerStateCode})` : ""}`
        : "-";

    const gstData = calculateGST(items, customerStateCode);
    const taxableTotal = gstData.taxableTotal;
    const grandTotal = Math.round(taxableTotal + gstData.totalGST);
    const amountInWords = convertNumberToWords(grandTotal);

    const fullCustomerAddress = [
      customerAddress,
      customerCity,
      customerState ? `${customerState}${customerStateCode ? ` (${customerStateCode})` : ""}` : "",
      customerPincode ? `PIN - ${customerPincode}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const fullShippingAddress = [
      customerShippingAddress,
      customerCity,
      customerState ? `${customerState}${customerStateCode ? ` (${customerStateCode})` : ""}` : "",
      customerPincode ? `PIN - ${customerPincode}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const itemsHtml = items
      .map((item, index) => {
        const productId = item.productId || item.productCode || item.id || "-";
        const productName = item.productName || item.name || "Item";
        const hsnCode = item.hsnCode || item.hsn || "-";
        const quantity = num(item.quantity);
        const price = num(item.price);
        const gstRate = num(item.gstRate) || 5;
        const itemDiscount = num(item.discount);
        const gross = quantity * price;
        const taxable = Math.max(0, gross - itemDiscount);
        const gstAmount = (taxable * gstRate) / 100;
        const total = taxable + gstAmount;

        return `
          <tr>
            <td class="center">${index + 1}</td>
            <td class="product-cell"><strong>${escapeHtml(productId)}</strong> - ${escapeHtml(productName)}</td>
            <td class="center">${escapeHtml(hsnCode)}</td>
            <td class="center">${quantity}</td>
            <td class="right">₹${money(price)}</td>
            <td class="center">${gstRate}%</td>
            <td class="right">₹${money(taxable)}</td>
            <td class="right">₹${money(total)}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GST Invoice - ${escapeHtml(invoiceNo)}</title>
        <style>
          @page { size: A4; margin: 4mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #ffffff; color: #111111; font-family: Arial, Helvetica, sans-serif; }
          .invoice { position: relative; width: 100%; max-width: 794px; margin: 0 auto; border: 1.5px solid #222; display: flex; flex-direction: column; background: #ffffff; overflow: hidden; }
          .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; overflow: hidden; }
          .watermark img { width: 300px; height: 300px; object-fit: contain; opacity: 0.05; filter: grayscale(100%); }
          .invoice > *:not(.watermark) { position: relative; z-index: 1; }
          .seller-header { text-align: center; padding: 8px 10px 6px; border-bottom: 1.2px solid #222; }
          .seller-header h1 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; }
          .seller-header p { margin: 2px 0; font-size: 9.5px; line-height: 1.3; }
          .invoice-title { text-align: center; font-size: 13px; font-weight: 900; margin-top: 4px; letter-spacing: 0.5px; }
          .customer-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #222; }
          .customer-box { padding: 6px 8px; min-height: auto; }
          .customer-box:first-child { border-right: 1px solid #222; }
          .box-title { font-weight: 900; font-size: 10.5px; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #777; }
          .customer-row { margin: 2px 0; font-size: 9.5px; line-height: 1.35; }
          .address { margin-top: 1px; line-height: 1.3; }
          .invoice-details { width: 100%; border-collapse: collapse; }
          .invoice-details td { border: 1px solid #555; padding: 4px 6px; font-size: 9.5px; vertical-align: top; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #555; padding: 3px 4px; font-size: 9px; }
          th { background: #f1f1f1; font-weight: 900; text-align: center; vertical-align: middle; }
          .center { text-align: center; }
          .right { text-align: right; }
          .items-table { margin-top: 0; table-layout: fixed; }
          .items-table th:nth-child(1) { width: 28px; }
          .items-table th:nth-child(2) { width: auto; }
          .items-table th:nth-child(3) { width: 50px; }
          .items-table th:nth-child(4) { width: 38px; }
          .items-table th:nth-child(5) { width: 65px; }
          .items-table th:nth-child(6) { width: 42px; }
          .items-table th:nth-child(7) { width: 75px; }
          .items-table th:nth-child(8) { width: 80px; }
          .bottom-area { margin-top: auto; }
          .summary-wrapper { display: grid; grid-template-columns: 1fr 260px; border-top: 1px solid #222; }
          .words-box { padding: 6px 8px; border-right: 1px solid #222; font-size: 9.5px; line-height: 1.4; }
          .tax-table td { padding: 3px 5px; font-size: 9px; }
          .tax-table .total-row td { font-size: 10px; font-weight: 900; border-top: 1.5px solid #222; background: #fafafa; }
          .bank-terms { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #222; }
          .bank-box, .terms-box { padding: 6px 8px; }
          .bank-box { border-right: 1px solid #222; }
          .section-heading { font-weight: 900; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #777; padding-bottom: 2px; }
          .bank-row { display: grid; grid-template-columns: 80px 1fr; font-size: 9px; margin: 3px 0; }
          .terms-box ol { margin: 0; padding-left: 14px; }
          .terms-box li { font-size: 8px; line-height: 1.3; margin-bottom: 2px; }
          .signature { padding: 8px 12px 10px; border-top: 1px solid #222; display: flex; align-items: flex-end; justify-content: flex-end; }
          .signature-line { width: 180px; border-top: 1px solid #222; padding-top: 4px; text-align: center; font-size: 9px; }
          .footer { text-align: center; border-top: 1px solid #222; padding: 4px; font-size: 8px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="watermark"><img src="${escapeHtml(logoImg)}" alt="Logo" /></div>
          
          <div class="seller-header">
            <h1>VRAJ CREATION</h1>
            <p>Madhuban Colony, Basni, Jodhpur (Raj.)</p>
            <p>GSTIN: 08AADPO3512A1ZB &nbsp;&nbsp; | &nbsp;&nbsp; PAN: AADPO3512A</p>
            <div class="invoice-title">GST INVOICE</div>
          </div>

          <div class="customer-grid">
            <div class="customer-box">
              <div class="box-title">Details of Receiver / Billed To</div>
              <div class="customer-row"><b>Name:</b> ${escapeHtml(customerName)}</div>
              <div class="customer-row"><b>Address:</b> <div class="address">${escapeHtml(fullCustomerAddress || "N/A")}</div></div>
              <div class="customer-row"><b>Mobile:</b> ${escapeHtml(customerPhone || "N/A")}</div>
              <div class="customer-row"><b>Customer GSTIN:</b> ${escapeHtml(customerGST || "N/A")}</div>
              <div class="customer-row"><b>State Code:</b> ${escapeHtml(customerStateCode || "N/A")}</div>
            </div>

            <div class="customer-box">
              <div class="box-title">Details of Consignee / Shipped To</div>
              <div class="customer-row"><b>Name:</b> ${escapeHtml(customerName)}</div>
              <div class="customer-row"><b>Shipping Address:</b> <div class="address">${escapeHtml(fullShippingAddress || "N/A")}</div></div>
              <div class="customer-row"><b>Mobile:</b> ${escapeHtml(customerPhone || "N/A")}</div>
              <div class="customer-row"><b>Customer GSTIN:</b> ${escapeHtml(customerGST || "N/A")}</div>
              <div class="customer-row"><b>State Code:</b> ${escapeHtml(customerStateCode || "N/A")}</div>
            </div>
          </div>

          <table class="invoice-details">
            <tbody>
              <tr>
                <td><b>Invoice No.</b><br />${escapeHtml(invoiceNo)}</td>
                <td><b>Invoice Date</b><br />${escapeHtml(formattedDate)}</td>
                <td><b>Place of Supply</b><br />${escapeHtml(placeOfSupply)}</td>
                <td><b>State Code</b><br />${escapeHtml(customerStateCode || "-")}</td>
              </tr>
            </tbody>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product ID - Name of Product</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST</th>
                <th>Taxable Value</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || `<tr><td colspan="8" class="center">No items added</td></tr>`}
            </tbody>
          </table>

          <div class="bottom-area">
            <div class="summary-wrapper">
              <div class="words-box">
                <b>Amount in Words:</b><br />${escapeHtml(amountInWords)}
              </div>

              <table class="tax-table">
                <tbody>
                  <tr>
                    <td><b>Total Amount Before Tax</b></td>
                    <td class="right">₹${money(taxableTotal)}</td>
                  </tr>
                  <tr>
                    <td><b>CGST (2.5%)</b></td>
                    <td class="right">₹${money(gstData.totalCGST)}</td>
                  </tr>
                  <tr>
                    <td><b>SGST (2.5%)</b></td>
                    <td class="right">₹${money(gstData.totalSGST)}</td>
                  </tr>
                  <tr>
                    <td><b>IGST (5%)</b></td>
                    <td class="right">₹${money(gstData.totalIGST)}</td>
                  </tr>
                  <tr class="total-row">
                    <td><b>Total Amount After Tax</b></td>
                    <td class="right">₹${money(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bank-terms">
              <div class="bank-box">
                <div class="section-heading">Bank Details</div>
                <div class="bank-row"><b>Bank Name</b><span>Union Bank of India</span></div>
                <div class="bank-row"><b>Branch</b><span>Basni Jodhpur</span></div>
                <div class="bank-row"><b>A/C No.</b><span>401701010035985</span></div>
                <div class="bank-row"><b>IFSC Code</b><span>UBIN0540170</span></div>
              </div>

              <div class="terms-box">
                <div class="section-heading">Terms & Conditions</div>
                <ol>
                  <li>All disputes subject to Jodhpur jurisdiction.</li>
                  <li>Our responsibility ceases after goods leave our factory.</li>
                  <li>Once sold, goods will not be taken back or exchanged.</li>
                  <li>Interest @ 24% will be charged if payment is not made within 15 days.</li>
                </ol>
              </div>
            </div>

            <div class="signature">
          <br /><br /><br /><br /><br />
              <div class="signature-line">
                Authorized Signatory<br /><b>VRAJ CREATION</b>
              </div>
            </div>

            <div class="footer">This is a computer-generated gst invoice.</div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            All Generated Bills & Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View, edit, manage, delete, and print customer gst invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/create-bill")}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-amber-700"
          >
            + Generate New Bill
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} className="ml-4 text-lg font-black">
            ×
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Bill No</th>
                <th className="px-5 py-3">Customer Name</th>
                <th className="px-5 py-3">Grand Total</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-600" />
                      Loading bills...
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center">
                    <div className="text-4xl">🧾</div>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      No bills generated yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/create-bill")}
                      className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                    >
                      Create First Bill
                    </button>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const billId = bill._id || bill.id;
                  const billNo = bill.invoiceNo || bill.billNumber || "-";
                  const customerName = bill.customer?.name || bill.customerName || "Walk-in Customer";
                  const total = bill.summary?.grandTotal ?? bill.grandTotal ?? 0;
                  const date = bill.invoiceDate || bill.createdAt;
                  const isDeleting = deletingId === billId;

                  return (
                    <tr key={billId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-400">{billNo}</td>
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{customerName}</td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">₹{money(total)}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {date ? new Date(date).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditBill(bill)}
                            disabled={isDeleting}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-400"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintBill(bill)}
                            disabled={isDeleting}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
                          >
                            🖨️ Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBill(bill)}
                            disabled={isDeleting}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400"
                          >
                            {isDeleting ? "Deleting..." : "🗑️ Delete"}
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
    </div>
  );
};

export default BillsList;