const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body } = require("express-validator");
const MedicalRecord = require("../models/MedicalRecord");
const cloudinary = require("../config/cloudinary");
const upload = require("../config/multer");
const streamifier = require("streamifier");
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { validate } = require("../middleware/validators");

// All routes below require a valid JWT
router.use(protect);

// Shared Cloudinary stream-upload helper
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "simplehealth" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

router.post(
  "/",
  [
    body("profile").notEmpty().withMessage("Profile ID is required"),
    body("images").notEmpty().withMessage("At least one image is required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { profile, images, doctorName, visitDate, notes } = req.body;

    const record = await MedicalRecord.create({
      profile,
      images,
      doctorName,
      visitDate,
      notes
    });

    res.status(201).json(record);
  })
);

router.post(
  "/upload",
  upload.array("images"),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No files uploaded");
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await streamUpload(file.buffer);
      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    res.status(200).json({ images: uploadedImages });
  })
);

router.post(
  "/create-with-images",
  upload.array("images"),
  [body("profile").notEmpty().withMessage("Profile ID is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { profile, doctorName, visitDate, notes } = req.body;

    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("At least one image is required");
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await streamUpload(file.buffer);
      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    const newRecord = await MedicalRecord.create({
      profile,
      doctorName,
      visitDate: visitDate || null,
      notes,
      images: uploadedImages
    });

    res.status(201).json(newRecord);
  })
);

router.delete(
  "/:recordId/image",
  [body("public_id").notEmpty().withMessage("public_id is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { public_id } = req.body;

    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // 2. Remove from MongoDB
    record.images = record.images.filter((img) => img.public_id !== public_id);

    await record.save();

    res.status(200).json({ message: "Image deleted successfully" });
  })
);

router.delete(
  "/:recordId/image/:imageId",
  asyncHandler(async (req, res) => {
    const { recordId, imageId } = req.params;

    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    const image = record.images.id(imageId);

    if (!image) {
      res.status(404);
      throw new Error("Image not found");
    }

    // delete from cloudinary
    await cloudinary.uploader.destroy(image.public_id);

    // remove from mongo array
    record.images.pull({ _id: imageId });

    await record.save();

    res.status(200).json({ message: "Image deleted successfully" });
  })
);

// GET Records by Profile
router.get(
  "/profile/:profileId",
  asyncHandler(async (req, res) => {
    const records = await MedicalRecord.aggregate([
      {
        $match: {
          profile: new mongoose.Types.ObjectId(req.params.profileId)
        }
      },
      {
        $addFields: {
          effectiveDate: { $ifNull: ["$visitDate", "$createdAt"] }
        }
      },
      { $sort: { effectiveDate: -1 } }
    ]);

    res.status(200).json(records);
  })
);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { profileId, doctorName, startDate, endDate } = req.query;

    if (!profileId) {
      res.status(400);
      throw new Error("Profile ID is required");
    }

    let query = { profile: profileId };

    if (doctorName) {
      query.doctorName = { $regex: doctorName, $options: "i" };
    }

    if (startDate && endDate) {
      query.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await MedicalRecord.find(query).sort({
      visitDate: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  })
);

// DELETE whole medical record (visit)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deletedRecord = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.status(200).json({ message: "Medical record deleted successfully" });
  })
);

module.exports = router;
