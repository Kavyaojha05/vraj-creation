
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

// =====================================================
// CONSTANTS
// =====================================================

const BUSINESS_NAME = "Vraj Creation";

const BUSINESS_TAGLINE =
  "Traditional Craft, Beautifully Made";

const BUSINESS_WHATSAPP =
  "918824968974";

// =====================================================
// FORMAT INR
// =====================================================

const formatINR = (amount) => {
  const value = Number(amount) || 0;

  return `Rs. ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
};

// =====================================================
// SAFE TEXT
// =====================================================

const safeText = (value, fallback = "N/A") => {
  const text = String(value ?? "").trim();

  return text || fallback;
};

// =====================================================
// GET ORDER
// =====================================================

const findOrder = async (orderNumber) => {
  return Order.findOne({
    orderNumber: String(
      orderNumber || ""
    )
      .trim()
      .toUpperCase(),
  });
};

// =====================================================
// COMMON PDF HEADER
// =====================================================

const drawHeader = (
  doc,
  title
) => {
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#8f3424")
    .text(BUSINESS_NAME);

  doc
    .moveDown(0.2)
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#6f6258")
    .text(BUSINESS_TAGLINE);

  doc
    .moveDown(0.8)
    .strokeColor("#d8c8b8")
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc
    .moveDown(0.7)
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#38271d")
    .text(title);

  doc.moveDown(0.5);
};

// =====================================================
// DRAW ORDER INFORMATION
// =====================================================

const drawOrderInfo = (
  doc,
  order
) => {
  const customer =
    order.customer || {};

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4e433c");

  doc.text(
    `Order No: ${safeText(
      order.orderNumber
    )}`
  );

  doc.text(
    `Order Date: ${
      order.createdAt
        ? new Date(
            order.createdAt
          ).toLocaleString("en-IN")
        : new Date().toLocaleString(
            "en-IN"
          )
    }`
  );

  if (order.status) {
    doc.text(
      `Order Status: ${String(
        order.status
      ).toUpperCase()}`
    );
  }

  doc.moveDown(0.8);

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#38271d")
    .text("Customer Details");

  doc.moveDown(0.3);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4e433c");

  doc.text(
    `Name: ${safeText(
      customer.fullName
    )}`
  );

  doc.text(
    `Mobile: ${safeText(
      customer.mobile
    )}`
  );

  if (customer.email) {
    doc.text(
      `Email: ${customer.email}`
    );
  }

  doc.text(
    `Address: ${safeText(
      customer.address
    )}`
  );

  doc.text(
    `City: ${safeText(
      customer.city
    )}`
  );

  doc.text(
    `Pincode: ${safeText(
      customer.pincode
    )}`
  );

  doc.moveDown(1);
};

// =====================================================
// TABLE HEADER
// =====================================================

const drawTableHeader = (
  doc
) => {
  const y = doc.y;

  doc
    .rect(
      50,
      y,
      495,
      24
    )
    .fill("#8f3424");

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor("#ffffff");

  doc.text(
    "#",
    57,
    y + 7,
    {
      width: 20,
    }
  );

  doc.text(
    "Product",
    82,
    y + 7,
    {
      width: 150,
    }
  );

  doc.text(
    "SKU / ID",
    235,
    y + 7,
    {
      width: 90,
    }
  );

  doc.text(
    "Qty",
    330,
    y + 7,
    {
      width: 40,
      align: "center",
    }
  );

  doc.text(
    "Price",
    375,
    y + 7,
    {
      width: 75,
      align: "right",
    }
  );

  doc.text(
    "Total",
    460,
    y + 7,
    {
      width: 75,
      align: "right",
    }
  );

  doc.y = y + 32;
};

// =====================================================
// DRAW PRODUCT ROW
// =====================================================

const drawProductRow = (
  doc,
  item,
  index
) => {
  const quantity =
    Number(item.quantity) || 1;

  const price =
    Number(item.price) || 0;

  const subtotal =
    Number(item.subtotal) ||
    price * quantity;

  const productId =
    item.sku ||
    item.productId ||
    "N/A";

  const rowY = doc.y;

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#38271d");

  doc.text(
    String(index + 1),
    57,
    rowY,
    {
      width: 20,
    }
  );

  doc.text(
    safeText(
      item.name,
      "Product"
    ),
    82,
    rowY,
    {
      width: 145,
    }
  );

  doc.text(
    productId,
    235,
    rowY,
    {
      width: 90,
    }
  );

  doc.text(
    String(quantity),
    330,
    rowY,
    {
      width: 40,
      align: "center",
    }
  );

  doc.text(
    formatINR(price),
    375,
    rowY,
    {
      width: 75,
      align: "right",
    }
  );

  doc.text(
    formatINR(subtotal),
    460,
    rowY,
    {
      width: 75,
      align: "right",
    }
  );

  doc.moveDown(0.8);

  doc
    .strokeColor("#eadfd5")
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.5);
};

// =====================================================
// DRAW TOTALS
// =====================================================

const drawTotals = (
  doc,
  order
) => {
  const pricing =
    order.pricing || {};

  const coupon =
    order.coupon || null;

  const subtotal =
    Number(
      pricing.subtotal
    ) || 0;

  const discount =
    Number(
      pricing.discount
    ) || 0;

  const finalTotal =
    Number(
      pricing.finalTotal ??
        pricing.finalAmount
    ) || 0;

  const startX = 350;

  doc.moveDown(0.8);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#4e433c");

  doc.text(
    `Subtotal: ${formatINR(
      subtotal
    )}`,
    startX,
    doc.y,
    {
      width: 195,
      align: "right",
    }
  );

  if (
    coupon?.code &&
    discount > 0
  ) {
    doc.moveDown(0.4);

    doc.text(
      `Coupon: ${coupon.code}`,
      startX,
      doc.y,
      {
        width: 195,
        align: "right",
      }
    );

    doc.moveDown(0.4);

    doc
      .fillColor("#248a4b")
      .text(
        `Discount: -${formatINR(
          discount
        )}`,
        startX,
        doc.y,
        {
          width: 195,
          align: "right",
        }
      );
  }

  doc.moveDown(0.7);

  doc
    .strokeColor("#cdbbaa")
    .moveTo(startX, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.7);

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor("#8f3424")
    .text(
      `TOTAL: ${formatINR(
        finalTotal
      )}`,
      startX,
      doc.y,
      {
        width: 195,
        align: "right",
      }
    );
};

// =====================================================
// FOOTER
// =====================================================

const drawFooter = (
  doc,
  isAdmin = false
) => {
  const bottomY =
    doc.page.height - 55;

  doc
    .strokeColor("#d8c8b8")
    .moveTo(50, bottomY - 10)
    .lineTo(
      doc.page.width - 50,
      bottomY - 10
    )
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#76685d");

  if (isAdmin) {
    doc.text(
      "Internal Admin Order Document",
      50,
      bottomY,
      {
        width: 250,
      }
    );
  } else {
    doc.text(
      "Thank you for shopping with Vraj Creation. 🙏",
      50,
      bottomY,
      {
        width: 400,
      }
    );
  }

  doc.text(
    `WhatsApp: +91 ${BUSINESS_WHATSAPP.slice(
      2
    )}`,
    350,
    bottomY,
    {
      width: 195,
      align: "right",
    }
  );
};

// =====================================================
// CUSTOMER PDF
// =====================================================

const generateCustomerPdf = async (
  req,
  res
) => {
  try {
    const order =
      await findOrder(
        req.params.orderNumber
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const doc =
      new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Vraj Creation Order ${order.orderNumber}`,
          Author: BUSINESS_NAME,
        },
      });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="Vraj-Creation-${order.orderNumber}.pdf"`
    );

    doc.pipe(res);

    drawHeader(
      doc,
      "Order Receipt"
    );

    drawOrderInfo(
      doc,
      order
    );

    drawTableHeader(doc);

    const items =
      order.items || [];

    items.forEach(
      (item, index) => {
        drawProductRow(
          doc,
          item,
          index
        );
      }
    );

    drawTotals(
      doc,
      order
    );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#38271d")
      .text(
        "Thank you for choosing Vraj Creation!"
      );

    doc
      .moveDown(0.3)
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#76685d")
      .text(
        "Traditional Craft, Beautifully Made."
      );

    drawFooter(
      doc,
      false
    );

    doc.end();
  } catch (error) {
    console.error(
      "CUSTOMER PDF ERROR:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to generate customer PDF.",
        error: error.message,
      });
    }

    res.end();
  }
};

// =====================================================
// ADMIN PDF
// =====================================================

const generateAdminPdf = async (
  req,
  res
) => {
  try {
    const order =
      await findOrder(
        req.params.orderNumber
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const doc =
      new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Vraj Creation Admin Order ${order.orderNumber}`,
          Author: BUSINESS_NAME,
        },
      });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="Vraj-Creation-Admin-${order.orderNumber}.pdf"`
    );

    doc.pipe(res);

    drawHeader(
      doc,
      "Admin Order Details"
    );

    drawOrderInfo(
      doc,
      order
    );

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#38271d")
      .text("Order Items");

    doc.moveDown(0.5);

    drawTableHeader(doc);

    const items =
      order.items || [];

    items.forEach(
      (item, index) => {
        drawProductRow(
          doc,
          item,
          index
        );
      }
    );

    drawTotals(
      doc,
      order
    );

    doc.moveDown(1.5);

    // =================================================
    // EXTRA ADMIN INFORMATION
    // =================================================

    const customer =
      order.customer || {};

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#38271d")
      .text("Additional Information");

    doc.moveDown(0.4);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#4e433c");

    doc.text(
      `Total Items: ${Number(
        order.totalItems || 0
      )}`
    );

    doc.text(
      `Status: ${String(
        order.status || "pending"
      ).toUpperCase()}`
    );

    if (
      order.coupon?.code
    ) {
      doc.text(
        `Coupon Code: ${order.coupon.code}`
      );

      doc.text(
        `Discount Percentage: ${
          Number(
            order.coupon.discount
          ) || 0
        }%`
      );
    }

    if (
      order.business?.name
    ) {
      doc.text(
        `Business: ${order.business.name}`
      );
    }

    if (
      order.business?.whatsapp
    ) {
      doc.text(
        `Business WhatsApp: ${order.business.whatsapp}`
      );
    }

    doc.moveDown(1);

    doc
      .fontSize(8)
      .fillColor("#76685d")
      .text(
        `Customer: ${safeText(
          customer.fullName
        )} | Mobile: ${safeText(
          customer.mobile
        )}`
      );

    drawFooter(
      doc,
      true
    );

    doc.end();
  } catch (error) {
    console.error(
      "ADMIN PDF ERROR:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to generate admin PDF.",
        error: error.message,
      });
    }

    res.end();
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  generateCustomerPdf,
  generateAdminPdf,
};