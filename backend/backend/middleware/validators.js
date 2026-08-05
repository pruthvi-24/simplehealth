const { body, validationResult } = require("express-validator");

// Run this after any validation chain — collects errors and responds 400
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
];

const loginRules = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
];

const profileRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("relation")
    .isIn([
      "Self",
      "Father",
      "Mother",
      "Grandfather",
      "Grandmother",
      "Son",
      "Daughter",
      "Brother",
      "Sister",
      "Spouse"
    ])
    .withMessage("Relation must be a valid family relation")
];

module.exports = { validate, registerRules, loginRules, profileRules };
