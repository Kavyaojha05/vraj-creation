const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("MONGO_URL is missing in .env file");
    }

    // High performance connection options
    const conn = await mongoose.connect(mongoURL, {
      maxPoolSize: 25,              // Concurrency badhata hai taaki multiple requests queue me na phasein
      minPoolSize: 5,               // Connection handshakes ka delay khatam karne ke liye idle connections maintain rakhta hai
      serverSelectionTimeoutMS: 5000, // 30s ke bajay 5s me failover dega agar DB unreachable ho
      socketTimeoutMS: 45000,       // Heavy queries par premature drop rokne ke liye
      family: 4,                    // IPv4 force karega, jo DNS lookup latency ko reduce karta hai
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;