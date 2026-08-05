require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/test-profile", profileRoutes);
app.use("/api/records", medicalRecordRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Must come after all routes: catches unmatched routes, then formats all errors
app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
