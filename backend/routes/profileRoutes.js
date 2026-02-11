const express = require("express");
const router = express.Router();

const Profile = require("../models/Profile");

router.post("/", async (req, res) => {
    const { name, relation } = req.body;

    if (!name || !relation) {
        return res.status(400).json({ message: "Please enter both details" });
    }

    try {
        const profile = await Profile.create({ name, relation });

        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Error saving profile" });
    }
});

router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find();
        res.status(200).json(profiles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profiles" });
    }
});

router.put("/:id", async (req, res) => {
    const { name, relation } = req.body;

    try {
        const updatedProfile = await Profile.findByIdAndUpdate(
            req.params.id,
            { name, relation },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json(updatedProfile);
    } catch (error) {
            console.log(error);   // 👈 VERY IMPORTANT
        res.status(500).json({ message: "Error updating profile" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deletedProfile = await Profile.findByIdAndDelete(req.params.id);

        if (!deletedProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting profile" });
    }
});


module.exports=router;