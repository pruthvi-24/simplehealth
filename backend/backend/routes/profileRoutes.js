const express = require("express");
const router = express.Router();

const Profile = require("../models/Profile");
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { validate, profileRules } = require("../middleware/validators");

// All routes below require a valid JWT
router.use(protect);

router.post(
  "/",
  profileRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, relation } = req.body;

    const profile = await Profile.create({ name, relation, user: req.user._id });

    res.status(201).json(profile);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const profiles = await Profile.find({ user: req.user._id });
    res.status(200).json(profiles);
  })
);

router.put(
  "/:id",
  profileRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, relation } = req.body;

    const updatedProfile = await Profile.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, relation },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      res.status(404);
      throw new Error("Profile not found");
    }

    res.status(200).json(updatedProfile);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deletedProfile = await Profile.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deletedProfile) {
      res.status(404);
      throw new Error("Profile not found");
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  })
);

module.exports = router;
