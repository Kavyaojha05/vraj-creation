const internalStockAuth = (req, res, next) => {
  try {
    // =================================================
    // SECRET FROM DASHBOARD ENV
    // =================================================

    const expectedSecret =
      process.env.INTERNAL_STOCK_SECRET;

    // =================================================
    // SECRET SENT BY WEBSITE BACKEND
    // =================================================

    const receivedSecret =
      req.headers["x-internal-secret"];

    // =================================================
    // ENV SECRET MISSING
    // =================================================

    if (!expectedSecret) {
      console.error(
        "INTERNAL_STOCK_SECRET is missing from Dashboard .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal stock security is not configured.",
      });
    }

    // =================================================
    // TEMPORARY DEBUG
    // =================================================
    // Actual secret print nahi hoga.
    // Sirf status aur length check hogi.

    console.log(
      "========== INTERNAL STOCK AUTH =========="
    );

    console.log(
      "Expected secret:",
      expectedSecret
        ? "LOADED"
        : "MISSING"
    );

    console.log(
      "Received secret:",
      receivedSecret
        ? "RECEIVED"
        : "MISSING"
    );

    console.log(
      "Expected length:",
      expectedSecret?.length
    );

    console.log(
      "Received length:",
      receivedSecret?.length
    );

    console.log(
      "========================================="
    );

    // =================================================
    // INVALID / MISSING SECRET
    // =================================================

    if (
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
      console.error(
        "INTERNAL STOCK AUTH FAILED"
      );

      return res.status(401).json({
        success: false,
        message:
          "Unauthorized internal stock request.",
      });
    }

    // =================================================
    // AUTHORIZED
    // =================================================

    console.log(
      "INTERNAL STOCK AUTH SUCCESS"
    );

    next();
  } catch (error) {
    console.error(
      "INTERNAL STOCK AUTH ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal stock authentication failed.",
    });
  }
};

module.exports = internalStockAuth;