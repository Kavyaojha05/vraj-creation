import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// NUMBER TO WORDS - INDIAN CURRENCY
// =====================================================
const convertNumberToWords = (amount) => {
  const numAmount = Number(amount);

  if (
    !Number.isFinite(numAmount) ||
    numAmount <= 0
  ) {
    return "Rupees Zero Only";
  }

  const ones = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];

  const tens = [
    "",
    "",
    "Twenty ",
    "Thirty ",
    "Forty ",
    "Fifty ",
    "Sixty ",
    "Seventy ",
    "Eighty ",
    "Ninety ",
  ];

  const twoDigit = (value) => {
    if (value === 0) return "";

    if (value < 20) {
      return ones[value];
    }

    return (
      tens[Math.floor(value / 10)] +
      ones[value % 10]
    );
  };

  const inWords = (value) => {
    value = Math.floor(value);

    if (value === 0) return "";

    let result = "";

    const crore = Math.floor(
      value / 10000000
    );

    value %= 10000000;

    const lakh = Math.floor(
      value / 100000
    );

    value %= 100000;

    const thousand = Math.floor(
      value / 1000
    );

    value %= 1000;

    const hundred = Math.floor(
      value / 100
    );

    const rest = value % 100;

    if (crore > 0) {
      result +=
        twoDigit(crore) +
        "Crore ";
    }

    if (lakh > 0) {
      result +=
        twoDigit(lakh) +
        "Lakh ";
    }

    if (thousand > 0) {
      result +=
        twoDigit(thousand) +
        "Thousand ";
    }

    if (hundred > 0) {
      result +=
        ones[hundred] +
        "Hundred ";
    }

    if (rest > 0) {
      if (result !== "") {
        result += "and ";
      }

      result += twoDigit(rest);
    }

    return result;
  };

  const [
    wholePart,
    decimalPart,
  ] = numAmount
    .toFixed(2)
    .split(".");

  const whole = Number(wholePart);
  const decimal = Number(decimalPart);

  let result =
    `Rupees ${inWords(whole).trim()}`;

  if (decimal > 0) {
    result +=
      ` and ${inWords(decimal).trim()} Paise`;
  }

  return `${result} Only`;
};

// =====================================================
// SAFE NUMBER
// =====================================================
const num = (value) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
};

// =====================================================
// FORMAT MONEY
// =====================================================
const money = (value) => {
  return num(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
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
// GST CALCULATION
// =====================================================
const calculateGST = (
  items,
  customerStateCode
) => {
  let taxableTotal = 0;

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const isRajasthan =
    String(customerStateCode || "")
      .trim() === "08";

  items.forEach((item) => {
    const quantity =
      num(item.quantity);

    const price =
      num(item.price);

    const itemDiscount =
      num(item.discount);

    const gstRate =
      num(item.gstRate) || 5;

    const gross =
      quantity * price;

    const taxable =
      Math.max(
        0,
        gross - itemDiscount
      );

    taxableTotal += taxable;

    if (isRajasthan) {
      const cgst =
        (taxable * gstRate) /
        200;

      const sgst =
        (taxable * gstRate) /
        200;

      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      const igst =
        (taxable * gstRate) /
        100;

      totalIGST += igst;
    }
  });

  return {
    taxableTotal,
    totalCGST,
    totalSGST,
    totalIGST,

    totalGST:
      totalCGST +
      totalSGST +
      totalIGST,
  };
};

// =====================================================
// COMPONENT
// =====================================================
const BillsList = () => {
  const [bills, setBills] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  // ===================================================
  // PAGE SIZE
  // ===================================================
  const [pageSize, setPageSize] =
    useState("A4");

  const navigate =
    useNavigate();

  // ===================================================
  // FETCH BILLS
  // ===================================================
  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/bills");

      const data =
        response.data;

      if (
        Array.isArray(
          data?.bills
        )
      ) {
        setBills(
          data.bills
        );
      } else if (
        Array.isArray(data)
      ) {
        setBills(data);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error(
        "Failed to fetch bills:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load bills list."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // ===================================================
  // DELETE BILL
  // ===================================================
  const handleDeleteBill = async (
    bill
  ) => {
    const id =
      bill._id ||
      bill.id;

    const billNo =
      bill.invoiceNo ||
      bill.billNumber ||
      "this bill";

    if (!id) {
      alert(
        "Bill ID not found."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${billNo}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await api.delete(
        `/bills/${id}`
      );

      // Remove immediately from UI
      setBills((prev) =>
        prev.filter(
          (item) =>
            (item._id || item.id) !== id
        )
      );

    } catch (err) {
      console.error(
        "Delete bill error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete bill."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // EDIT BILL
  // ===================================================
  const handleEditBill = (
    bill
  ) => {
    const id =
      bill._id ||
      bill.id;

    if (!id) {
      alert(
        "Bill ID not found."
      );
      return;
    }

    navigate(
      `/edit-bill/${id}`
    );
  };

  // ===================================================
  // PRINT BILL
  // ===================================================
  const handlePrintBill = (
    bill,
    selectedPageSize = "A4"
  ) => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (!printWindow) {
      alert(
        "Popup blocked! Please allow popups for this website."
      );

      return;
    }

    // =================================================
    // ITEMS
    // =================================================
    const items =
      Array.isArray(bill.items)
        ? bill.items
        : [];

    // =================================================
    // BASIC DETAILS
    // =================================================
    const invoiceNo =
      bill.invoiceNo ||
      bill.billNumber ||
      "-";

    const invoiceDate =
      bill.invoiceDate ||
      bill.createdAt;

    const formattedDate =
      invoiceDate
        ? new Date(
            invoiceDate
          ).toLocaleDateString(
            "en-IN"
          )
        : "-";

    // =================================================
    // CUSTOMER OBJECT
    // =================================================
    const customer =
      bill.customer || {};

    // =================================================
    // CUSTOMER NAME
    // =================================================
    const customerName =
      customer.name ||
      bill.customerName ||
      "Walk-in Customer";

    // =================================================
    // BILLING ADDRESS
    // =================================================
    const customerAddress =
      customer.billingAddress ||
      customer.address ||
      bill.customerBillingAddress ||
      bill.customerAddress ||
      bill.billingAddress ||
      "";

    // =================================================
    // SHIPPING ADDRESS
    // =================================================
    const customerShippingAddress =
      customer.shippingAddress ||
      bill.customerShippingAddress ||
      bill.shippingAddress ||
      customerAddress ||
      "";

    // =================================================
    // PHONE
    // =================================================
    const customerPhone =
      customer.phone ||
      bill.customerPhone ||
      "";

    // =================================================
    // GSTIN
    // =================================================
    const customerGST =
      customer.gstin ||
      customer.gstIn ||
      bill.customerGSTIN ||
      bill.customerGst ||
      "";

    // =================================================
    // PINCODE
    // =================================================
    const customerPincode =
      customer.pincode ||
      customer.pinCode ||
      bill.customerPincode ||
      bill.pincode ||
      "";

    // =================================================
    // CITY
    // =================================================
    const customerCity =
      customer.city ||
      bill.customerCity ||
      bill.city ||
      "";

    // =================================================
    // STATE
    // =================================================
    const customerState =
      customer.state ||
      bill.customerState ||
      bill.state ||
      "";

    // =================================================
    // STATE CODE
    // =================================================
    const customerStateCode =
      customer.stateCode ||
      bill.customerStateCode ||
      bill.stateCode ||
      "";

    // =================================================
    // PLACE OF SUPPLY
    // =================================================
    const placeOfSupply =
      bill.placeOfSupply ||
      (
        customerState
          ? `${customerState}${
              customerStateCode
                ? ` (${customerStateCode})`
                : ""
            }`
          : "-"
      );

    // =================================================
    // GST
    // =================================================
    const gstData =
      calculateGST(
        items,
        customerStateCode
      );

    // =================================================
    // TAXABLE TOTAL
    // =================================================
    const taxableTotal =
      gstData.taxableTotal;

    // =================================================
    // GRAND TOTAL
    // =================================================
    const grandTotal =
      Math.round(
        taxableTotal +
        gstData.totalGST
      );

    // =================================================
    // AMOUNT WORDS
    // =================================================
    const amountInWords =
      convertNumberToWords(
        grandTotal
      );

    // =================================================
    // FULL BILLING ADDRESS
    // =================================================
    const fullCustomerAddress = [
      customerAddress,

      customerCity,

      customerState
        ? `${customerState}${
            customerStateCode
              ? ` (${customerStateCode})`
              : ""
          }`
        : "",

      customerPincode
        ? `PIN - ${customerPincode}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    // =================================================
    // FULL SHIPPING ADDRESS
    // =================================================
    const fullShippingAddress = [
      customerShippingAddress,

      customerCity,

      customerState
        ? `${customerState}${
            customerStateCode
              ? ` (${customerStateCode})`
              : ""
          }`
        : "",

      customerPincode
        ? `PIN - ${customerPincode}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    // =================================================
    // ITEMS HTML
    // =================================================
    const itemsHtml =
      items
        .map(
          (item, index) => {
            const productId =
              item.productId ||
              item.productID ||
              item.id ||
              "-";

            const productName =
              item.productName ||
              item.name ||
              "Item";

            const hsnCode =
              item.hsnCode ||
              item.hsn ||
              "-";

            const quantity =
              num(item.quantity);

            const price =
              num(item.price);

            const gstRate =
              num(item.gstRate) ||
              5;

            const itemDiscount =
              num(item.discount);

            const gross =
              quantity * price;

            const taxable =
              Math.max(
                0,
                gross -
                  itemDiscount
              );

            const gstAmount =
              (taxable *
                gstRate) /
              100;

            const total =
              taxable +
              gstAmount;

            return `
              <tr>

                <td class="center">
                  ${index + 1}
                </td>

                <td class="product-cell">

                  <strong>
                    ${escapeHtml(
                      productId
                    )}
                  </strong>

                  -

                  ${escapeHtml(
                    productName
                  )}

                </td>

                <td class="center">
                  ${escapeHtml(
                    hsnCode
                  )}
                </td>

                <td class="center">
                  ${quantity}
                </td>

                <td class="right">
                  ₹${money(price)}
                </td>

                <td class="center">
                  ${gstRate}%
                </td>

                <td class="right">
                  ₹${money(taxable)}
                </td>

                <td class="right">
                  ₹${money(total)}
                </td>

              </tr>
            `;
          }
        )
        .join("");

    // =================================================
    // PRINT HTML
    // =================================================
    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          Tax Invoice -
          ${escapeHtml(invoiceNo)}
        </title>

        <style>

          /* =========================================
             PAGE
          ========================================= */

          @page {
            size: ${selectedPageSize};
            margin: 8mm;
          }

          /* =========================================
             GLOBAL
          ========================================= */

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }

          body {
            color: #111;

            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          /* =========================================
             INVOICE
          ========================================= */

          .invoice {

            position: relative;

            width: 100%;

            max-width: 794px;

            min-height: 1120px;

            margin: 0 auto;

            border:
              1.5px solid #222;

            display: flex;

            flex-direction: column;

            background: #fff;

            overflow: hidden;

          }

          /* =========================================
             WATERMARK
          ========================================= */

          .watermark {

            position: absolute;

            inset: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            pointer-events: none;

            z-index: 0;

            overflow: hidden;

          }

          .watermark img {

            width: 360px;

            height: 360px;

            object-fit: contain;

            opacity: 0.065;

            filter:
              grayscale(100%);

          }

          .invoice > *:not(.watermark) {

            position: relative;

            z-index: 1;

          }

          /* =========================================
             HEADER
          ========================================= */

          .seller-header {

            text-align: center;

            padding:
              14px
              15px
              10px;

            border-bottom:
              1.5px solid #222;

          }

          .seller-header h1 {

            margin: 0;

            font-size: 24px;

            font-weight: 900;

            text-transform:
              uppercase;

            letter-spacing:
              0.5px;

          }

          .seller-header p {

            margin:
              4px 0;

            font-size: 11px;

            line-height:
              1.4;

          }

          .invoice-title {

            text-align: center;

            font-size: 15px;

            font-weight: 900;

            margin-top: 8px;

            letter-spacing:
              0.7px;

          }

          /* =========================================
             CUSTOMER DETAILS
          ========================================= */

          .top-details {

            display: grid;

            grid-template-columns:
              1fr 1fr;

            border-bottom:
              1px solid #222;

          }

          .box {

            padding: 11px;

            min-height: 175px;

          }

          .box:first-child {

            border-right:
              1px solid #222;

          }

          .box-title {

            font-weight: 900;

            font-size: 12px;

            text-transform:
              uppercase;

            margin-bottom: 9px;

            padding-bottom: 5px;

            border-bottom:
              1px solid #777;

          }

          .box p {

            margin:
              5px 0;

            font-size:
              10.5px;

            line-height:
              1.45;

          }

          .address-text {

            line-height:
              1.5;

          }

          /* =========================================
             INVOICE DETAILS
          ========================================= */

          .invoice-details {

            width: 100%;

            border-collapse:
              collapse;

          }

          .invoice-details td {

            border:
              1px solid #555;

            padding:
              8px 7px;

            font-size:
              10px;

            vertical-align:
              top;

          }

          /* =========================================
             TABLE
          ========================================= */

          table {

            width: 100%;

            border-collapse:
              collapse;

          }

          th,
          td {

            border:
              1px solid #555;

            padding:
              6px 5px;

            font-size:
              10px;

          }

          th {

            background:
              #f1f1f1;

            font-weight:
              900;

            text-align:
              center;

            vertical-align:
              middle;

          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .product-cell {
            line-height: 1.35;
          }

          /* =========================================
             ITEMS
          ========================================= */

          .items-table {
            margin-top: 0;
          }

          .items-table th:nth-child(1) {
            width: 32px;
          }

          .items-table th:nth-child(2) {
            width: auto;
          }

          .items-table th:nth-child(3) {
            width: 55px;
          }

          .items-table th:nth-child(4) {
            width: 45px;
          }

          .items-table th:nth-child(5) {
            width: 75px;
          }

          .items-table th:nth-child(6) {
            width: 50px;
          }

          .items-table th:nth-child(7) {
            width: 85px;
          }

          .items-table th:nth-child(8) {
            width: 90px;
          }

          /* =========================================
             BOTTOM
          ========================================= */

          .bottom-area {
            margin-top: auto;
          }

          /* =========================================
             SUMMARY
          ========================================= */

          .summary-wrapper {

            display: grid;

            grid-template-columns:
              1fr 280px;

            border-top:
              1px solid #222;

          }

          .words-box {

            padding: 10px;

            min-height:
              110px;

            border-right:
              1px solid #222;

            font-size:
              10px;

            line-height:
              1.5;

          }

          .words-box strong {
            font-size: 10px;
          }

          .tax-table td {

            padding:
              5px 6px;

            font-size:
              10px;

          }

          .tax-table .total-row td {

            font-size:
              12px;

            font-weight:
              900;

            border-top:
              2px solid #222;

          }

          /* =========================================
             BANK + TERMS
          ========================================= */

          .bank-terms {

            display: grid;

            grid-template-columns:
              1fr 1fr;

            border-top:
              1px solid #222;

          }

          .bank-box,
          .terms-box {

            padding:
              10px;

            min-height:
              135px;

          }

          .bank-box {

            border-right:
              1px solid #222;

          }

          .section-heading {

            font-weight:
              900;

            font-size:
              11px;

            text-transform:
              uppercase;

            margin-bottom:
              8px;

            border-bottom:
              1px solid #777;

            padding-bottom:
              4px;

          }

          .bank-row {

            display: grid;

            grid-template-columns:
              90px 1fr;

            font-size:
              10px;

            margin:
              5px 0;

            line-height:
              1.35;

          }

          .terms-box ol {

            margin: 0;

            padding-left:
              17px;

          }

          .terms-box li {

            font-size:
              9px;

            line-height:
              1.5;

            margin-bottom:
              4px;

          }

          /* =========================================
             SIGNATURE
          ========================================= */

          .signature {

            min-height:
              145px;

            padding:
              15px
              18px
              18px;

            border-top:
              1px solid #222;

            display: flex;

            align-items:
              flex-end;

            justify-content:
              flex-end;

          }

          .signature-line {

            width:
              210px;

            border-top:
              1px solid #222;

            padding-top:
              7px;

            text-align:
              center;

            font-size:
              10px;

            line-height:
              1.5;

          }

          /* =========================================
             FOOTER
          ========================================= */

          .footer {

            text-align:
              center;

            border-top:
              1px solid #222;

            padding:
              7px;

            font-size:
              9px;

            line-height:
              1.3;

          }

          /* =========================================
             PRINT
          ========================================= */

          @media print {

            body {

              -webkit-print-color-adjust:
                exact;

              print-color-adjust:
                exact;

            }

            .invoice {

              border:
                1.5px solid #222;

            }

          }

        </style>

      </head>

      <body>

        <div class="invoice">

          <!-- WATERMARK -->

          <div class="watermark">

            <img
              src="${logoImg}"
              alt="Vraj Creation Logo"
            />

          </div>


          <!-- SELLER HEADER -->

          <div class="seller-header">

            <h1>
              VRAJ CREATION
            </h1>

            <p>
              Madhuban Colony, Basni,
              Jodhpur (Raj.)
            </p>

            <p>

              GSTIN:
              08AATPQ4257E1ZB

              &nbsp;&nbsp; | &nbsp;&nbsp;

              PAN:
              AATPQ4257E

            </p>

            <div class="invoice-title">

              TAX INVOICE

            </div>

          </div>


          <!-- CUSTOMER DETAILS -->

          <div class="top-details">

            <!-- BILL TO -->

            <div class="box">

              <div class="box-title">

                Details of Receiver / Billed To

              </div>

              <p>

                <b>Name:</b>
                ${escapeHtml(
                  customerName
                )}

              </p>

              <p class="address-text">

                <b>Address:</b><br />

                ${escapeHtml(
                  fullCustomerAddress ||
                    "-"
                )}

              </p>

              ${
                customerGST
                  ? `
                    <p>
                      <b>GSTIN:</b>
                      ${escapeHtml(
                        customerGST
                      )}
                    </p>
                  `
                  : ""
              }

              ${
                customerPhone
                  ? `
                    <p>
                      <b>Mobile:</b>
                      ${escapeHtml(
                        customerPhone
                      )}
                    </p>
                  `
                  : ""
              }

              <p>

                <b>State:</b>

                ${escapeHtml(
                  customerState ||
                    "-"
                )}

              </p>

              <p>

                <b>State Code:</b>

                ${escapeHtml(
                  customerStateCode ||
                    "-"
                )}

              </p>

            </div>


            <!-- SHIPPED TO -->

            <div class="box">

              <div class="box-title">

                Details of Consignee / Shipped To

              </div>

              <p>

                <b>Name:</b>

                ${escapeHtml(
                  customerName
                )}

              </p>

              <p class="address-text">

                <b>Shipping Address:</b><br />

                ${escapeHtml(
                  fullShippingAddress ||
                    "-"
                )}

              </p>

              ${
                customerGST
                  ? `
                    <p>
                      <b>GSTIN:</b>
                      ${escapeHtml(
                        customerGST
                      )}
                    </p>
                  `
                  : ""
              }

              ${
                customerPhone
                  ? `
                    <p>
                      <b>Mobile:</b>
                      ${escapeHtml(
                        customerPhone
                      )}
                    </p>
                  `
                  : ""
              }

              <p>

                <b>State:</b>

                ${escapeHtml(
                  customerState ||
                    "-"
                )}

              </p>

              <p>

                <b>State Code:</b>

                ${escapeHtml(
                  customerStateCode ||
                    "-"
                )}

              </p>

            </div>

          </div>


          <!-- INVOICE DETAILS -->

          <table class="invoice-details">

            <tbody>

              <tr>

                <td>

                  <b>Invoice No.</b>

                  <br />

                  ${escapeHtml(
                    invoiceNo
                  )}

                </td>

                <td>

                  <b>Invoice Date</b>

                  <br />

                  ${escapeHtml(
                    formattedDate
                  )}

                </td>

                <td>

                  <b>Place of Supply</b>

                  <br />

                  ${escapeHtml(
                    placeOfSupply
                  )}

                </td>

                <td>

                  <b>State Code</b>

                  <br />

                  ${escapeHtml(
                    customerStateCode ||
                      "-"
                  )}

                </td>

              </tr>

            </tbody>

          </table>


          <!-- PRODUCTS -->

          <table class="items-table">

            <thead>

              <tr>

                <th>
                  S.No
                </th>

                <th>
                  Product ID - Name of Product
                </th>

                <th>
                  HSN
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Rate
                </th>

                <th>
                  GST
                </th>

                <th>
                  Taxable Value
                </th>

                <th>
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              ${
                itemsHtml ||
                `
                  <tr>

                    <td
                      colspan="8"
                      class="center"
                    >

                      No items added

                    </td>

                  </tr>
                `
              }

            </tbody>

          </table>


          <!-- BOTTOM -->

          <div class="bottom-area">


            <!-- SUMMARY -->

            <div class="summary-wrapper">

              <div class="words-box">

                <strong>
                  Amount in Words:
                </strong>

                <br />

                ${escapeHtml(
                  amountInWords
                )}

              </div>


              <table class="tax-table">

                <tbody>

                  <tr>

                    <td>
                      Total Amount Before Tax
                    </td>

                    <td class="right">

                      ₹${money(
                        taxableTotal
                      )}

                    </td>

                  </tr>


                  <tr>

                    <td>
                      CGST
                    </td>

                    <td class="right">

                      ₹${money(
                        gstData.totalCGST
                      )}

                    </td>

                  </tr>


                  <tr>

                    <td>
                      SGST
                    </td>

                    <td class="right">

                      ₹${money(
                        gstData.totalSGST
                      )}

                    </td>

                  </tr>


                  <tr>

                    <td>
                      IGST
                    </td>

                    <td class="right">

                      ₹${money(
                        gstData.totalIGST
                      )}

                    </td>

                  </tr>


                  <tr>

                    <td>
                      Total GST
                    </td>

                    <td class="right">

                      ₹${money(
                        gstData.totalGST
                      )}

                    </td>

                  </tr>


                  <tr class="total-row">

                    <td>
                      Total Amount After Tax
                    </td>

                    <td class="right">

                      ₹${money(
                        grandTotal
                      )}

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>


            <!-- BANK + TERMS -->

            <div class="bank-terms">


              <!-- BANK -->

              <div class="bank-box">

                <div class="section-heading">

                  Bank Details

                </div>

                <div class="bank-row">

                  <b>
                    Bank Name
                  </b>

                  <span>
                    Bank of Baroda
                  </span>

                </div>

                <div class="bank-row">

                  <b>
                    Branch
                  </b>

                  <span>
                    Kudi Housing Board,
                    Jodhpur
                  </span>

                </div>

                <div class="bank-row">

                  <b>
                    A/C No.
                  </b>

                  <span>
                    5499020000256
                  </span>

                </div>

                <div class="bank-row">

                  <b>
                    IFSC Code
                  </b>

                  <span>
                    BARBOKUDIBIH
                  </span>

                </div>

              </div>


              <!-- TERMS -->

              <div class="terms-box">

                <div class="section-heading">

                  Terms & Conditions

                </div>

                <ol>

                  <li>
                    All disputes subject to
                    Jodhpur jurisdiction.
                  </li>

                  <li>
                    Our responsibility ceases
                    after goods leave our factory.
                  </li>

                  <li>
                    Once sold, goods will not
                    be taken back or exchanged.
                  </li>

                  <li>
                    Interest @ 24% will be
                    charged if payment is not
                    made within 15 days.
                  </li>

                </ol>

              </div>

            </div>


            <!-- SIGNATURE -->

            <div class="signature">

              <div class="signature-line">

                Authorized Signatory

                <br />

                <b>
                  VRAJ CREATION
                </b>

              </div>

            </div>


            <!-- FOOTER -->

            <div class="footer">

              This is a computer-generated
              tax invoice.

            </div>

          </div>

        </div>


        <!-- AUTO PRINT -->

        <script>

          window.onload = function () {

            setTimeout(
              function () {

                window.print();

              },
              400
            );

          };

        </script>

      </body>

      </html>
    `);

    printWindow.document.close();
  };

  // ===================================================
  // UI
  // ===================================================
  return (
    <div className="mx-auto max-w-7xl">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white">

            All Generated Bills & Invoices

          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400">

            View, edit, manage, delete, and print
            customer tax invoices

          </p>

        </div>


        {/* =================================================
            HEADER ACTIONS
        ================================================= */}

        <div className="flex flex-wrap items-center gap-2">

          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">

            Page Size:

          </label>


          <select
            value={pageSize}
            onChange={(e) =>
              setPageSize(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >

            <option value="A4">
              A4
            </option>

            <option value="A5">
              A5
            </option>

            <option value="Letter">
              Letter
            </option>

            <option value="A3">
              A3
            </option>

          </select>


          <button
            onClick={() =>
              navigate(
                "/create-bill"
              )
            }
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-amber-700"
          >

            + Generate New Bill

          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">

          <span>
            ⚠️ {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
            className="ml-4 text-lg font-black"
          >
            ×
          </button>

        </div>

      )}


      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px] text-left text-sm">

            {/* TABLE HEADER */}

            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">

              <tr>

                <th className="px-5 py-3">
                  Bill No
                </th>

                <th className="px-5 py-3">
                  Customer Name
                </th>

                <th className="px-5 py-3">
                  Grand Total
                </th>

                <th className="px-5 py-3">
                  Date
                </th>

                <th className="px-5 py-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>


            {/* TABLE BODY */}

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (

                <tr>

                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-slate-400"
                  >

                    <div className="flex items-center justify-center gap-2">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-600" />

                      Loading bills...

                    </div>

                  </td>

                </tr>

              ) : bills.length === 0 ? (

                /* =================================================
                   EMPTY
                ================================================= */

                <tr>

                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center"
                  >

                    <div className="text-4xl">
                      🧾
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-500">

                      No bills generated yet.

                    </p>

                    <button
                      onClick={() =>
                        navigate(
                          "/create-bill"
                        )
                      }
                      className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                    >

                      Create First Bill

                    </button>

                  </td>

                </tr>

              ) : (

                /* =================================================
                   BILLS
                ================================================= */

                bills.map(
                  (bill) => {

                    const billId =
                      bill._id ||
                      bill.id;

                    const billNo =
                      bill.invoiceNo ||
                      bill.billNumber ||
                      "-";

                    const customerName =
                      bill.customer?.name ||
                      bill.customerName ||
                      "Walk-in Customer";

                    const total =
                      bill.summary?.grandTotal ??
                      bill.grandTotal ??
                      0;

                    const date =
                      bill.invoiceDate ||
                      bill.createdAt;

                    const isDeleting =
                      deletingId === billId;

                    return (

                      <tr
                        key={billId}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >

                        {/* BILL NO */}

                        <td className="px-5 py-3 font-bold text-amber-600 dark:text-amber-400">

                          {billNo}

                        </td>


                        {/* CUSTOMER */}

                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">

                          {customerName}

                        </td>


                        {/* TOTAL */}

                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">

                          ₹
                          {money(total)}

                        </td>


                        {/* DATE */}

                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">

                          {date
                            ? new Date(
                                date
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}

                        </td>


                        {/* ACTIONS */}

                        <td className="px-5 py-3">

                          <div className="flex flex-wrap items-center justify-center gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEditBill(
                                  bill
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/60"
                            >

                              ✏️ Edit

                            </button>


                            {/* PRINT */}

                            <button
                              type="button"
                              onClick={() =>
                                handlePrintBill(
                                  bill,
                                  pageSize
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >

                              🖨️ Print

                            </button>


                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteBill(
                                  bill
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                            >

                              {isDeleting
                                ? "Deleting..."
                                : "🗑️ Delete"}

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

    </div>
  );
};

export default BillsList;