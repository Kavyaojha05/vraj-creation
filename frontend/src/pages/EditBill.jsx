import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import logoImg from "../assets/logo.jpeg";

// =====================================================
// STATE CODE MAP
// =====================================================
const STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// =====================================================
// GET STATE CODE BY NAME
// =====================================================
const getStateCodeByName = (stateName) => {
  if (!stateName) return "";

  const normalized = String(stateName).trim().toLowerCase();

  const found = Object.entries(STATE_CODES).find(
    ([, name]) => name.toLowerCase() === normalized
  );

  return found ? found[0] : "";
};

// =====================================================
// NUMBER TO WORDS — INDIAN CURRENCY
// =====================================================
const convertNumberToWords = (amount) => {
  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return "Rupees Zero Only";
  }

  if (numAmount === 0) {
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

  const convertBelowThousand = (num) => {
    let result = "";

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      result += ones[num] + " ";
    }

    return result.trim();
  };

  const rupees = Math.floor(numAmount);
  const paise = Math.round((numAmount - rupees) * 100);

  let result = "";

  const crore = Math.floor(rupees / 10000000);

  if (crore > 0) {
    result += convertBelowThousand(crore) + " Crore ";
  }

  const lakh = Math.floor((rupees % 10000000) / 100000);

  if (lakh > 0) {
    result += convertBelowThousand(lakh) + " Lakh ";
  }

  const thousand = Math.floor((rupees % 100000) / 1000);

  if (thousand > 0) {
    result += convertBelowThousand(thousand) + " Thousand ";
  }

  const remainder = rupees % 1000;

  if (remainder > 0) {
    result += convertBelowThousand(remainder);
  }

  result = result.trim();

  if (paise > 0) {
    result += ` and ${convertBelowThousand(paise)} Paise`;
  }

  return `Rupees ${result} Only`;
};

// =====================================================
// CURRENCY
// =====================================================
const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// =====================================================
// DEFAULT CUSTOMER
// =====================================================
const DEFAULT_CUSTOMER = {
  name: "",
  phone: "",
  billingAddress: "",
  shippingAddress: "",
  city: "",
  state: "",
  stateCode: "",
  pincode: "",
  gstin: "",
};

// =====================================================
// EMPTY ITEM
// =====================================================
const createEmptyItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  productId: "",
  productName: "",
  hsnCode: "",
  quantity: 1,
  price: 0,
  gstRate: 5,
});

// =====================================================
// SAFE DATE
// =====================================================
const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  try {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

// =====================================================
// EDIT BILL
// =====================================================
const EditBill = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ===================================================
  // BUSINESS INFO
  // ===================================================
  const [businessInfo, setBusinessInfo] = useState({
    name: "VRAJ CREATION",
    logo: logoImg,
    address: "Jodhpur, Rajasthan",
    cityState: "Jodhpur, Rajasthan",
    state: "Rajasthan",
    stateCode: "08",
    phone: "+91 9876543210",
    email: "contact@vrajcreation.com",
    gstin: "08AAAAA0000A1Z5",
    pan: "ABCDE1234F",
    bankName: "HDFC Bank",
    accountHolder: "VRAJ CREATION",
    accountNo: "50200012345678",
    ifsc: "HDFC0001234",
    branch: "Jodhpur Branch",
    upiId: "vrajcreation@upi",
    terms:
      "1. Goods once sold will not be taken back.\n2. All disputes subject to Jodhpur jurisdiction.\n3. Payment should be made within the agreed terms.\n4. Interest @24% p.a. will be charged on delayed payment.",
    signature: "",
  });

  // ===================================================
  // STATES
  // ===================================================
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("GST Invoice");

  const [customer, setCustomer] = useState(DEFAULT_CUSTOMER);

  const [items, setItems] = useState([createEmptyItem()]);

  const [shippingCharges, setShippingCharges] = useState(0);

  const [dbProducts, setDbProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState("");

  // ===================================================
  // LOAD BUSINESS SETTINGS
  // ===================================================
  useEffect(() => {
    try {
      const savedBusiness = localStorage.getItem("vraj_business_settings");

      if (savedBusiness) {
        const parsed = JSON.parse(savedBusiness);

        setBusinessInfo((prev) => ({
          ...prev,
          ...parsed,
          logo: parsed.logo || prev.logo,
        }));
      }
    } catch (err) {
      console.error("Business settings load error:", err);
    }
  }, []);

  // ===================================================
  // LOAD BILL + PRODUCTS
  // ===================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [billResponse, productsResponse] = await Promise.all([
          api.get(`/bills/${id}`),
          api.get("/products"),
        ]);

        // ===============================================
        // BILL DATA
        // ===============================================
        const bill =
          billResponse?.data?.bill ||
          billResponse?.data?.data ||
          billResponse?.data;

        if (!bill) {
          throw new Error("Bill data not found.");
        }

        // ===============================================
        // INVOICE DETAILS
        // ===============================================
        setInvoiceNo(
          bill.invoiceNo ||
            bill.billNumber ||
            bill.invoiceNumber ||
            `VC-${Date.now().toString().slice(-6)}`
        );

        setInvoiceDate(
          formatDateForInput(
            bill.invoiceDate || bill.date || bill.createdAt
          )
        );

        setDueDate(formatDateForInput(bill.dueDate));

        setInvoiceType(
          bill.invoiceType ||
            bill.type ||
            "GST Invoice"
        );

        // ===============================================
        // CUSTOMER
        // ===============================================
        const nestedCustomer = bill.customer || {};

        const loadedCustomer = {
          name:
            nestedCustomer.name ||
            bill.customerName ||
            "",

          phone:
            nestedCustomer.phone ||
            bill.customerPhone ||
            "",

          billingAddress:
            nestedCustomer.billingAddress ||
            nestedCustomer.address ||
            bill.customerBillingAddress ||
            bill.customerAddress ||
            bill.billingAddress ||
            "",

          shippingAddress:
            nestedCustomer.shippingAddress ||
            bill.customerShippingAddress ||
            bill.shippingAddress ||
            "",

          city:
            nestedCustomer.city ||
            bill.customerCity ||
            bill.city ||
            "",

          state:
            nestedCustomer.state ||
            bill.customerState ||
            bill.state ||
            "",

          stateCode:
            nestedCustomer.stateCode ||
            bill.customerStateCode ||
            bill.stateCode ||
            "",

          pincode:
            nestedCustomer.pincode ||
            bill.customerPincode ||
            bill.pincode ||
            "",

          gstin:
            nestedCustomer.gstin ||
            nestedCustomer.GSTIN ||
            bill.customerGst ||
            bill.customerGSTIN ||
            bill.gstin ||
            "",
        };

        // If state name exists but state code is blank
        if (!loadedCustomer.stateCode && loadedCustomer.state) {
          loadedCustomer.stateCode = getStateCodeByName(
            loadedCustomer.state
          );
        }

        // If state code exists but state name is blank
        if (!loadedCustomer.state && loadedCustomer.stateCode) {
          const cleanCode = String(loadedCustomer.stateCode)
            .replace(/\D/g, "")
            .padStart(2, "0");

          loadedCustomer.state =
            STATE_CODES[cleanCode] || "";
        }

        setCustomer(loadedCustomer);

        // ===============================================
        // ITEMS
        // ===============================================
        const loadedItems = Array.isArray(bill.items)
          ? bill.items
          : [];

        if (loadedItems.length > 0) {
          setItems(
            loadedItems.map((item, index) => ({
              id:
                item.id ||
                item._id ||
                `${Date.now()}-${index}-${Math.random()}`,

              productId:
                item.productId ||
                item.sku ||
                item.productCode ||
                "",

              productName:
                item.productName ||
                item.name ||
                "",

              hsnCode:
                item.hsnCode ||
                item.hsn ||
                "7326",

              quantity:
                Number(item.quantity) || 1,

              price:
                Number(
                  item.price ??
                    item.rate ??
                    item.sellingPrice ??
                    0
                ) || 0,

              gstRate:
                Number(
                  item.gstRate ??
                    item.gst ??
                    item.taxRate ??
                    5
                ) || 0,
            }))
          );
        } else {
          setItems([createEmptyItem()]);
        }

        // ===============================================
        // SHIPPING CHARGES
        // ===============================================
        setShippingCharges(
          Number(
            bill.shippingCharges ??
              bill.summary?.shippingCharges ??
              0
          ) || 0
        );

        // ===============================================
        // PRODUCTS
        // ===============================================
        const products =
          Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : Array.isArray(productsResponse?.data?.products)
            ? productsResponse.data.products
            : [];

        setDbProducts(products);
      } catch (err) {
        console.error("Edit bill load error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load bill."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // ===================================================
  // CUSTOMER CHANGE
  // ===================================================
  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "pincode") {
      setPincodeMessage("");
    }
  };

  // ===================================================
  // STATE CHANGE
  // ===================================================
  const handleStateChange = (value) => {
    const stateCode = getStateCodeByName(value);

    setCustomer((prev) => ({
      ...prev,
      state: value,
      stateCode: stateCode || prev.stateCode,
    }));
  };

  // ===================================================
  // STATE CODE CHANGE
  // ===================================================
  const handleStateCodeChange = (value) => {
    const cleanCode = String(value)
      .replace(/\D/g, "")
      .slice(0, 2);

    setCustomer((prev) => ({
      ...prev,
      stateCode: cleanCode,
      state: STATE_CODES[cleanCode] || prev.state,
    }));
  };

  // ===================================================
  // PINCODE LOOKUP
  // ===================================================
  const handlePincodeLookup = async (value) => {
    const cleanPincode = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    handleCustomerChange("pincode", cleanPincode);

    if (cleanPincode.length !== 6) {
      return;
    }

    try {
      setPincodeLoading(true);
      setPincodeMessage("");

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanPincode}`
      );

      const data = await response.json();

      if (
        !Array.isArray(data) ||
        data[0]?.Status !== "Success" ||
        !data[0]?.PostOffice?.length
      ) {
        setPincodeMessage("Pincode not found.");
        return;
      }

      const office = data[0].PostOffice[0];

      const state = office.State || "";

      const city =
        office.District ||
        office.Division ||
        office.Block ||
        office.Name ||
        "";

      const stateCode = getStateCodeByName(state);

      setCustomer((prev) => ({
        ...prev,
        pincode: cleanPincode,
        city,
        state,
        stateCode: stateCode || prev.stateCode,
      }));

      setPincodeMessage(
        `${city}${state ? `, ${state}` : ""}`
      );
    } catch (err) {
      console.error("Pincode lookup error:", err);
      setPincodeMessage("Unable to fetch pincode details.");
    } finally {
      setPincodeLoading(false);
    }
  };

  // ===================================================
  // PRODUCT SELECT
  // ===================================================
  const handleSelectProductFromDb = (
    rowId,
    selectedProductId
  ) => {
    const selectedProduct = dbProducts.find((product) => {
      const id =
        product.sku ||
        product.product_id ||
        product.productId ||
        product.productCode ||
        product.code ||
        product._id ||
        product.id;

      return String(id) === String(selectedProductId);
    });

    if (!selectedProduct) {
      return;
    }

    const productId =
      selectedProduct.sku ||
      selectedProduct.product_id ||
      selectedProduct.productId ||
      selectedProduct.productCode ||
      selectedProduct.code ||
      selectedProduct._id ||
      selectedProduct.id ||
      "";

    const productName =
      selectedProduct.name ||
      selectedProduct.productName ||
      selectedProduct.title ||
      "";

    const hsnCode =
      selectedProduct.hsnCode ||
      selectedProduct.hsn ||
      selectedProduct.HSN ||
      "7326";

    const price =
      selectedProduct.price ??
      selectedProduct.sellingPrice ??
      selectedProduct.selling_price ??
      selectedProduct.rate ??
      selectedProduct.mrp ??
      0;

    const gstRate =
      selectedProduct.gstRate ??
      selectedProduct.gst ??
      selectedProduct.taxRate ??
      5;

    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              productId,
              productName,
              hsnCode,
              price: Number(price) || 0,
              gstRate: Number(gstRate) || 0,
            }
          : item
      )
    );
  };

  // ===================================================
  // ITEM CHANGE
  // ===================================================
  const handleItemChange = (
    id,
    field,
    value
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "price" ||
                field === "gstRate"
                  ? value
                  : value,
            }
          : item
      )
    );
  };

  // ===================================================
  // ADD ITEM
  // ===================================================
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      createEmptyItem(),
    ]);
  };

  // ===================================================
  // REMOVE ITEM
  // ===================================================
  const removeItem = (id) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter(
        (item) => item.id !== id
      );
    });
  };

  // ===================================================
  // TOTAL CALCULATION
  // ===================================================
  const calculateTotals = useMemo(() => {
    let subtotal = 0;
    let totalTaxable = 0;
    let totalGst = 0;

    const businessStateCode = String(
      businessInfo.stateCode || ""
    )
      .trim()
      .padStart(2, "0");

    const customerStateCode = String(
      customer.stateCode || ""
    )
      .trim()
      .padStart(2, "0");

    const businessState = String(
      businessInfo.state || ""
    )
      .trim()
      .toLowerCase();

    const customerState = String(
      customer.state || ""
    )
      .trim()
      .toLowerCase();

    let isInterstate = false;

    if (
      businessStateCode &&
      customerStateCode
    ) {
      isInterstate =
        businessStateCode !== customerStateCode;
    } else if (
      businessState &&
      customerState
    ) {
      isInterstate =
        businessState !== customerState;
    }

    const gstGroups = {};

    items.forEach((item) => {
      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.price) || 0;

      const gstRate =
        invoiceType === "GST Invoice"
          ? Number(item.gstRate) || 0
          : 0;

      const lineTaxable =
        quantity * price;

      const lineGst =
        (lineTaxable * gstRate) / 100;

      subtotal += lineTaxable;
      totalTaxable += lineTaxable;
      totalGst += lineGst;

      if (gstRate > 0) {
        if (!gstGroups[gstRate]) {
          gstGroups[gstRate] = {
            rate: gstRate,
            taxable: 0,
            gst: 0,
          };
        }

        gstGroups[gstRate].taxable +=
          lineTaxable;

        gstGroups[gstRate].gst +=
          lineGst;
      }
    });

    const cgst =
      invoiceType === "GST Invoice" &&
      !isInterstate
        ? totalGst / 2
        : 0;

    const sgst =
      invoiceType === "GST Invoice" &&
      !isInterstate
        ? totalGst / 2
        : 0;

    const igst =
      invoiceType === "GST Invoice" &&
      isInterstate
        ? totalGst
        : 0;

    const shipping =
      Number(shippingCharges) || 0;

    const beforeRoundOff =
      totalTaxable +
      totalGst +
      shipping;

    const grandTotal =
      Math.round(beforeRoundOff);

    const roundOff =
      grandTotal - beforeRoundOff;

    return {
      subtotal,
      totalTaxable,
      totalGst,
      cgst,
      sgst,
      igst,
      shipping,
      beforeRoundOff,
      grandTotal,
      roundOff,
      isInterstate,
      gstGroups:
        Object.values(gstGroups).sort(
          (a, b) => a.rate - b.rate
        ),
    };
  }, [
    items,
    invoiceType,
    shippingCharges,
    businessInfo.state,
    businessInfo.stateCode,
    customer.state,
    customer.stateCode,
  ]);

  // ===================================================
  // PLACE OF SUPPLY
  // ===================================================
  const placeOfSupply = useMemo(() => {
    if (
      customer.state &&
      customer.stateCode
    ) {
      return `${customer.state} (${customer.stateCode})`;
    }

    if (customer.state) {
      return customer.state;
    }

    if (customer.stateCode) {
      return (
        STATE_CODES[
          String(customer.stateCode)
            .padStart(2, "0")
        ] ||
        customer.stateCode
      );
    }

    return "-";
  }, [
    customer.state,
    customer.stateCode,
  ]);

  // ===================================================
  // UPDATE BILL
  // ===================================================
  const handleUpdateInvoice = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ===============================================
      // VALIDATION
      // ===============================================
      if (!invoiceNo.trim()) {
        setError("Invoice number is required.");
        return;
      }

      if (!customer.name.trim()) {
        setError("Customer name is required.");
        return;
      }

      if (!customer.billingAddress.trim()) {
        setError(
          "Customer billing address is required."
        );
        return;
      }

      const validItems = items.filter(
        (item) =>
          String(item.productName || "").trim() &&
          Number(item.quantity) > 0
      );

      if (validItems.length === 0) {
        setError(
          "Please add at least one valid product."
        );
        return;
      }

      // ===============================================
      // CLEAN CUSTOMER
      // ===============================================
      const cleanCustomer = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        billingAddress:
          customer.billingAddress.trim(),
        shippingAddress:
          customer.shippingAddress.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        stateCode:
          customer.stateCode.trim(),
        pincode:
          customer.pincode.trim(),
        gstin:
          customer.gstin.trim(),
      };

      // ===============================================
      // CLEAN ITEMS
      // ===============================================
      const cleanItems = validItems.map(
        (item) => ({
          productId:
            item.productId || "",
          productName:
            item.productName.trim(),
          hsnCode:
            item.hsnCode || "7326",
          quantity:
            Number(item.quantity) || 1,
          price:
            Number(item.price) || 0,
          gstRate:
            invoiceType === "GST Invoice"
              ? Number(item.gstRate) || 0
              : 0,
        })
      );

      // ===============================================
      // PAYLOAD
      // ===============================================
      const payload = {
        // ---------------------------------------------
        // Invoice
        // ---------------------------------------------
        invoiceNo: invoiceNo.trim(),

        // Backend compatibility
        billNumber: invoiceNo.trim(),

        invoiceDate,
        dueDate,
        invoiceType,

        // ---------------------------------------------
        // Customer
        // ---------------------------------------------
        customer: cleanCustomer,

        customerName:
          cleanCustomer.name,

        customerPhone:
          cleanCustomer.phone,

        customerGst:
          cleanCustomer.gstin,

        customerGSTIN:
          cleanCustomer.gstin,

        customerAddress:
          cleanCustomer.billingAddress,

        customerBillingAddress:
          cleanCustomer.billingAddress,

        billingAddress:
          cleanCustomer.billingAddress,

        customerShippingAddress:
          cleanCustomer.shippingAddress,

        shippingAddress:
          cleanCustomer.shippingAddress,

        customerCity:
          cleanCustomer.city,

        city:
          cleanCustomer.city,

        customerState:
          cleanCustomer.state,

        state:
          cleanCustomer.state,

        customerStateCode:
          cleanCustomer.stateCode,

        stateCode:
          cleanCustomer.stateCode,

        customerPincode:
          cleanCustomer.pincode,

        pincode:
          cleanCustomer.pincode,

        // ---------------------------------------------
        // Place Of Supply
        // ---------------------------------------------
        placeOfSupply,

        placeOfSupplyState:
          cleanCustomer.state,

        placeOfSupplyStateCode:
          cleanCustomer.stateCode,

        // ---------------------------------------------
        // Items
        // ---------------------------------------------
        items: cleanItems,

        // ---------------------------------------------
        // Summary
        // ---------------------------------------------
        summary: {
          subtotal:
            calculateTotals.subtotal,

          subTotal:
            calculateTotals.subtotal,

          totalTaxable:
            calculateTotals.totalTaxable,

          totalAmountBeforeTax:
            calculateTotals.totalTaxable,

          totalGst:
            calculateTotals.totalGst,

          totalTax:
            calculateTotals.totalGst,

          cgst:
            calculateTotals.cgst,

          sgst:
            calculateTotals.sgst,

          igst:
            calculateTotals.igst,

          shippingCharges:
            calculateTotals.shipping,

          roundOff:
            calculateTotals.roundOff,

          grandTotal:
            calculateTotals.grandTotal,

          totalAmountAfterTax:
            calculateTotals.grandTotal,

          amountInWords:
            convertNumberToWords(
              calculateTotals.grandTotal
            ),
        },

        // ---------------------------------------------
        // Top Level Totals
        // ---------------------------------------------
        subTotal:
          calculateTotals.subtotal,

        subtotal:
          calculateTotals.subtotal,

        totalTax:
          calculateTotals.totalGst,

        totalGst:
          calculateTotals.totalGst,

        cgst:
          calculateTotals.cgst,

        sgst:
          calculateTotals.sgst,

        igst:
          calculateTotals.igst,

        shippingCharges:
          calculateTotals.shipping,

        roundOff:
          calculateTotals.roundOff,

        grandTotal:
          calculateTotals.grandTotal,

        totalAmountBeforeTax:
          calculateTotals.totalTaxable,

        totalAmountAfterTax:
          calculateTotals.grandTotal,

        amountInWords:
          convertNumberToWords(
            calculateTotals.grandTotal
          ),

        isInterstate:
          calculateTotals.isInterstate,
      };

      // ===============================================
      // UPDATE API
      // ===============================================
      await api.put(
        `/bills/${id}`,
        payload
      );

      setSuccess(
        "Invoice updated successfully!"
      );

      // ===============================================
      // GO BACK TO BILLS
      // ===============================================
      setTimeout(() => {
        navigate("/bills");
      }, 1000);
    } catch (err) {
      console.error(
        "Update invoice error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update invoice."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Loading Invoice...
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please wait while invoice details are loaded.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6 print:p-0 print:bg-white">
      {/* =================================================
          PRINT CSS
      ================================================= */}
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
          }

          input,
          textarea,
          select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          .print-hide-border {
            border: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-container">
        {/* =================================================
            TOP HEADER
        ================================================= */}
        <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Invoice Management
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Edit Invoice
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Update invoice details and save changes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/bills")}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold transition"
          >
            ← Back to Bills
          </button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}
        {error && (
          <div className="no-print mb-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="no-print mb-5 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {/* =================================================
            INVOICE
        ================================================= */}
        <div className="print-card bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* =================================================
              BUSINESS HEADER
          ================================================= */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4">
                {businessInfo.logo && (
                  <img
                    src={businessInfo.logo}
                    alt="Business Logo"
                    className="w-20 h-20 object-contain rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                    {businessInfo.name}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {businessInfo.address}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {businessInfo.cityState}
                  </p>

                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Phone:</strong>{" "}
                      {businessInfo.phone}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {businessInfo.email}
                    </p>

                    <p>
                      <strong>GSTIN:</strong>{" "}
                      {businessInfo.gstin}
                    </p>

                    <p>
                      <strong>PAN:</strong>{" "}
                      {businessInfo.pan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:text-right">
                <h3 className="text-3xl font-black text-blue-600">
                  INVOICE
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Original for Recipient
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              INVOICE DETAILS
          ================================================= */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <SectionTitle title="Invoice Details" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField
                label="Invoice Number"
                value={invoiceNo}
                onChange={(e) =>
                  setInvoiceNo(e.target.value)
                }
              />

              <InputField
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) =>
                  setInvoiceDate(e.target.value)
                }
              />

              <InputField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
              />

              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Invoice Type
                </label>

                <select
                  value={invoiceType}
                  onChange={(e) =>
                    setInvoiceType(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GST Invoice">
                    GST Invoice
                  </option>

                  <option value="Non-GST Invoice">
                    Non-GST Invoice
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* =================================================
              CUSTOMER
          ================================================= */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <SectionTitle title="Customer Details" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Customer Name *"
                value={customer.name}
                onChange={(e) =>
                  handleCustomerChange(
                    "name",
                    e.target.value
                  )
                }
              />

              <InputField
                label="Mobile Number"
                value={customer.phone}
                onChange={(e) =>
                  handleCustomerChange(
                    "phone",
                    e.target.value
                  )
                }
              />

              {invoiceType === "GST Invoice" && (
                <InputField
                  label="Customer GSTIN"
                  value={customer.gstin}
                  onChange={(e) =>
                    handleCustomerChange(
                      "gstin",
                      e.target.value.toUpperCase()
                    )
                  }
                />
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Pincode
                </label>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={customer.pincode}
                    onChange={(e) =>
                      handlePincodeLookup(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 6 digit pincode"
                  />

                  {pincodeLoading && (
                    <span className="absolute right-3 top-3 text-xs text-blue-600">
                      Loading...
                    </span>
                  )}
                </div>

                {pincodeMessage && (
                  <p className="mt-1 text-xs text-blue-600">
                    {pincodeMessage}
                  </p>
                )}
              </div>

              <InputField
                label="City"
                value={customer.city}
                onChange={(e) =>
                  handleCustomerChange(
                    "city",
                    e.target.value
                  )
                }
              />

              <InputField
                label="State"
                value={customer.state}
                onChange={(e) =>
                  handleStateChange(
                    e.target.value
                  )
                }
                placeholder="e.g. Rajasthan"
              />

              <InputField
                label="State Code"
                value={customer.stateCode}
                maxLength={2}
                onChange={(e) =>
                  handleStateCodeChange(
                    e.target.value
                  )
                }
                placeholder="08"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1.5">
                  Billing Address *
                </label>

                <textarea
                  rows={3}
                  value={customer.billingAddress}
                  onChange={(e) =>
                    handleCustomerChange(
                      "billingAddress",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Customer billing address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1.5">
                  Shipping Address
                </label>

                <textarea
                  rows={3}
                  value={customer.shippingAddress}
                  onChange={(e) =>
                    handleCustomerChange(
                      "shippingAddress",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Shipping address"
                />
              </div>

              <InputField
                label="Place of Supply"
                value={placeOfSupply}
                readOnly
              />

              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  GST Type
                </label>

                <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5">
                  <span
                    className={`font-bold ${
                      calculateTotals.isInterstate
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {calculateTotals.isInterstate
                      ? "IGST — Interstate"
                      : "CGST + SGST — Intrastate"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <SectionTitle title="Products / Items" />

              <button
                type="button"
                onClick={addItem}
                className="no-print px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                + Add Product
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      #
                    </th>

                    <th className="px-3 py-3 text-left">
                      Product ID
                    </th>

                    <th className="px-3 py-3 text-left">
                      Product Name
                    </th>

                    <th className="px-3 py-3 text-left">
                      HSN
                    </th>

                    <th className="px-3 py-3 text-left">
                      Qty
                    </th>

                    <th className="px-3 py-3 text-left">
                      Rate
                    </th>

                    {invoiceType === "GST Invoice" && (
                      <th className="px-3 py-3 text-left">
                        GST %
                      </th>
                    )}

                    <th className="px-3 py-3 text-right">
                      Amount
                    </th>

                    <th className="px-3 py-3 text-center no-print">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const quantity =
                      Number(item.quantity) || 0;

                    const price =
                      Number(item.price) || 0;

                    const amount =
                      quantity * price;

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-3 py-3 font-semibold">
                          {index + 1}
                        </td>

                        {/* PRODUCT ID */}
                        <td className="px-3 py-3">
                          <select
                            value={item.productId}
                            onChange={(e) =>
                              handleSelectProductFromDb(
                                item.id,
                                e.target.value
                              )
                            }
                            className="w-full min-w-[150px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">
                              Select Product ID
                            </option>

                            {dbProducts.map(
                              (product) => {
                                const productId =
                                  product.sku ||
                                  product.product_id ||
                                  product.productId ||
                                  product.productCode ||
                                  product.code ||
                                  product._id ||
                                  product.id;

                                const productName =
                                  product.name ||
                                  product.productName ||
                                  product.title ||
                                  "";

                                return (
                                  <option
                                    key={String(
                                      productId
                                    )}
                                    value={String(
                                      productId
                                    )}
                                  >
                                    {productId}
                                    {productName
                                      ? ` — ${productName}`
                                      : ""}
                                  </option>
                                );
                              }
                            )}
                          </select>
                        </td>

                        {/* PRODUCT NAME */}
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={
                              item.productName
                            }
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "productName",
                                e.target.value
                              )
                            }
                            className="w-full min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Product name"
                          />
                        </td>

                        {/* HSN */}
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "hsnCode",
                                e.target.value
                              )
                            }
                            className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="9988"
                          />
                        </td>

                        {/* QTY */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* RATE */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "price",
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>

                        {/* GST */}
                        {invoiceType ===
                          "GST Invoice" && (
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.gstRate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "gstRate",
                                  e.target.value
                                )
                              }
                              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        )}

                        {/* AMOUNT */}
                        <td className="px-3 py-3 text-right font-bold whitespace-nowrap">
                          ₹{formatCurrency(amount)}
                        </td>

                        {/* ACTION */}
                        <td className="px-3 py-3 text-center no-print">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            disabled={
                              items.length === 1
                            }
                            className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================
              BOTTOM SECTION
          ================================================= */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ===========================================
                  BANK DETAILS
              =========================================== */}
              <div>
                <SectionTitle title="Bank Details" />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm">
                  <p>
                    <strong>Bank:</strong>{" "}
                    {businessInfo.bankName}
                  </p>

                  <p>
                    <strong>Account Holder:</strong>{" "}
                    {businessInfo.accountHolder}
                  </p>

                  <p>
                    <strong>Account No:</strong>{" "}
                    {businessInfo.accountNo}
                  </p>

                  <p>
                    <strong>IFSC:</strong>{" "}
                    {businessInfo.ifsc}
                  </p>

                  <p>
                    <strong>Branch:</strong>{" "}
                    {businessInfo.branch}
                  </p>

                  <p>
                    <strong>UPI:</strong>{" "}
                    {businessInfo.upiId}
                  </p>
                </div>

                {/* TERMS */}
                <div className="mt-6">
                  <SectionTitle title="Terms & Conditions" />

                  <textarea
                    value={businessInfo.terms}
                    onChange={(e) =>
                      setBusinessInfo(
                        (prev) => ({
                          ...prev,
                          terms:
                            e.target.value,
                        })
                      )
                    }
                    rows={7}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* ===========================================
                  SUMMARY
              =========================================== */}
              <div>
                <SectionTitle title="Invoice Summary" />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* BEFORE TAX */}
                  <SummaryRow
                    label="Total Amount Before Tax"
                    value={`₹${formatCurrency(
                      calculateTotals.totalTaxable
                    )}`}
                  />

                  {/* GST */}
                  {invoiceType ===
                    "GST Invoice" && (
                    <>
                      {!calculateTotals.isInterstate ? (
                        <>
                          <SummaryRow
                            label="CGST"
                            value={`₹${formatCurrency(
                              calculateTotals.cgst
                            )}`}
                          />

                          <SummaryRow
                            label="SGST"
                            value={`₹${formatCurrency(
                              calculateTotals.sgst
                            )}`}
                          />
                        </>
                      ) : (
                        <SummaryRow
                          label="IGST"
                          value={`₹${formatCurrency(
                            calculateTotals.igst
                          )}`}
                        />
                      )}

                      <SummaryRow
                        label="Total GST"
                        value={`₹${formatCurrency(
                          calculateTotals.totalGst
                        )}`}
                      />
                    </>
                  )}

                  {/* SHIPPING */}
                  <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">
                      Shipping Charges
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCharges}
                      onChange={(e) =>
                        setShippingCharges(
                          e.target.value
                        )
                      }
                      className="w-36 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-right outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* ROUND OFF */}
                  <SummaryRow
                    label="Round Off"
                    value={`₹${formatCurrency(
                      calculateTotals.roundOff
                    )}`}
                  />

                  {/* AFTER TAX */}
                  <div className="flex items-center justify-between px-4 py-4 bg-blue-600 text-white">
                    <span className="text-lg font-black">
                      Total Amount After Tax
                    </span>

                    <span className="text-xl font-black">
                      ₹
                      {formatCurrency(
                        calculateTotals.grandTotal
                      )}
                    </span>
                  </div>

                  {/* WORDS */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                      Amount in Words
                    </p>

                    <p className="font-semibold text-sm">
                      {convertNumberToWords(
                        calculateTotals.grandTotal
                      )}
                    </p>
                  </div>

                  {/* PLACE OF SUPPLY */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                      Place of Supply
                    </p>

                    <p className="font-semibold">
                      {placeOfSupply}
                    </p>
                  </div>
                </div>

                {/* TAX SUMMARY */}
                {invoiceType ===
                  "GST Invoice" &&
                  calculateTotals.gstGroups
                    .length > 0 && (
                    <div className="mt-5">
                      <h4 className="font-bold mb-3">
                        Tax Summary
                      </h4>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-left">
                                GST %
                              </th>

                              <th className="px-3 py-2 text-right">
                                Taxable
                              </th>

                              <th className="px-3 py-2 text-right">
                                GST
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {calculateTotals.gstGroups.map(
                              (group) => (
                                <tr
                                  key={
                                    group.rate
                                  }
                                  className="border-t border-slate-200 dark:border-slate-700"
                                >
                                  <td className="px-3 py-2">
                                    {group.rate}%
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    ₹
                                    {formatCurrency(
                                      group.taxable
                                    )}
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    ₹
                                    {formatCurrency(
                                      group.gst
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* =================================================
                SIGNATURE
            ================================================= */}
            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:justify-between gap-8">
                <div>
                  <p className="text-sm text-slate-500">
                    Customer Signature
                  </p>

                  <div className="h-20" />
                </div>

                <div className="md:text-right">
                  <p className="text-sm font-semibold">
                    For {businessInfo.name}
                  </p>

                  {businessInfo.signature ? (
                    <img
                      src={businessInfo.signature}
                      alt="Authorized Signature"
                      className="w-36 h-20 object-contain ml-auto mt-2"
                    />
                  ) : (
                    <div className="h-20" />
                  )}

                  <p className="text-sm text-slate-500">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ACTION BUTTONS
        ================================================= */}
        <div className="no-print flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition"
          >
            🖨 Print Preview
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleUpdateInvoice}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold transition"
          >
            {saving
              ? "Updating Invoice..."
              : "✓ Update Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// REUSABLE INPUT
// =====================================================
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  maxLength,
  readOnly = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${
          readOnly
            ? "bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed"
            : "bg-white dark:bg-slate-800"
        }`}
      />
    </div>
  );
};

// =====================================================
// SECTION TITLE
// =====================================================
const SectionTitle = ({ title }) => {
  return (
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
      {title}
    </h3>
  );
};

// =====================================================
// SUMMARY ROW
// =====================================================
const SummaryRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <span className="font-semibold">
        {label}
      </span>

      <span className="font-bold">
        {value}
      </span>
    </div>
  );
};

export default EditBill;