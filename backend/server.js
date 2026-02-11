require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Profile = require("./models/profile");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SimpleHealth Backend Running 🚀");
});

app.post("/api/test-profile", async (req, res) => {
    const { name, relation } = req.body;

    if (!name || !relation) {
        return res.status(400).json({ message: "Please enter both details" });
    }

    try {
        const profile = await Profile.create({ name, relation });

        res.status(201).json(profile);
    } catch (error) {
      console.log(error);  // 🔥 important
        res.status(500).json({ message: "Error saving profile" });
    }
});

app.get("/api/test-profile", async (req, res) => {
    try {
        const profiles = await Profile.find();
        res.status(200).json(profiles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profiles" });
    }
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
