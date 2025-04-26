const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = "mongodb://localhost:27017/sdn_gr4";
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
