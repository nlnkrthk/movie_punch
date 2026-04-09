const express = require("express");
const { handleAssistantQuery } = require("../controllers/assistantController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// The endpoint accepts queries. We make the authMiddleware optional by
// checking if the header exists, allowing non-logged in users to still query.
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  // Not logged in is okay, they just won't have context
  next();
};

router.post("/", optionalAuth, handleAssistantQuery);

module.exports = router;
