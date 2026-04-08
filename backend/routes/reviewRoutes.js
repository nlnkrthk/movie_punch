const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addReview,
  getReviews,
  getReviewStats,
  getMyReviews,
  deleteReview,
} = require("../controllers/reviewController");

// Protected routes — must be logged in
router.get("/me", authMiddleware, getMyReviews);
router.post("/", authMiddleware, addReview);
router.delete("/:id", authMiddleware, deleteReview);

// Public routes — anyone can read reviews
router.get("/:movieId/stats", getReviewStats);
router.get("/:movieId", getReviews);

module.exports = router;
