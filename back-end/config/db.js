const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = `${process.env.URL}${process.env.DBNAME}`;
    await mongoose.connect(mongoURI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("MongoDB connected...");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
