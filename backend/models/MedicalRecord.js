const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true
    },
    images: {
      type: [String],   // Array of image URLs
      required: true
    },
    doctorName: {
      type: String,
      trim: true
    },
    visitDate: {
      type: Date,

    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }  // adds createdAt & updatedAt automatically
);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

module.exports = MedicalRecord;
