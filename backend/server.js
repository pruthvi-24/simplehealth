require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();
app.use(cors());
app.use(express.json());

const profileRoutes = require("./routes/profileRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

app.use("/api/test-profile", profileRoutes);
app.use("/api/records", medicalRecordRoutes);


app.get("/", (req, res) => {
  res.send("SimpleHealth Backend Running 🚀");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
