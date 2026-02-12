const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const MedicalRecord = require("../models/MedicalRecord");
const cloudinary = require("../config/cloudinary");
const upload = require("../config/multer");
const streamifier = require("streamifier");


router.post("/", async (req, res) => {
  const { profile, images, doctorName, visitDate, notes } = req.body;

  if (!profile || !images ) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const record = await MedicalRecord.create({
      profile,
      images,
      doctorName,
      visitDate,
      notes
    });

    res.status(201).json(record);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating medical record" });
  }
});
router.post("/upload", upload.array("images"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const uploadedImages = [];

    for (const file of req.files) {
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

      const result = await streamUpload(file.buffer);
      uploadedImages.push(result.secure_url);
    }

    res.status(200).json({ images: uploadedImages });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading images" });
  }
});



// GET Records by Profile
router.get("/profile/:profileId", async (req, res) => {
  try {
    const records = await MedicalRecord.aggregate([
      {
        $match:
        {
            profile: new mongoose.Types.ObjectId(req.params.profileId)
        }
      },
      {
        $addFields: {
          effectiveDate: {
            $ifNull: ["$visitDate", "$createdAt"]
          }
        }
      },
      {
        $sort: { effectiveDate: -1 }
      }
    ]);

    res.status(200).json(records);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching records" });
  }
});


router.get("/search", async (req, res) => {
  const { profileId, doctorName, startDate, endDate } = req.query;

  if (!profileId) {
    return res.status(400).json({ message: "Profile ID is required" });
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

  try {
    const records = await MedicalRecord.find(query).sort({
      visitDate: -1,
      createdAt: -1
    });

    res.status(200).json(records);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching records" });
  }
});



// DELETE whole medical record (visit)
router.delete("/:id", async (req, res) => {
  try {
    const deletedRecord = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Medical record deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting record" });
  }
});

// DELETE single image from a record
router.delete("/:recordId/image", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL required" });
  }

  try {
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.recordId,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting image" });
  }
});




module.exports = router;
