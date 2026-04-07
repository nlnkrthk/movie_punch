const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addReview,
  getReviews,
  getReviewStats,
  deleteReview,
} = require("../controllers/reviewController");

// Public routes — anyone can read reviews
router.get("/:movieId", getReviews);
router.get("/:movieId/stats", getReviewStats);

// Protected routes — must be logged in
router.post("/", authMiddleware, addReview);
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;
