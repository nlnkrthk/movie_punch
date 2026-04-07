const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  checkWatchlist,
} = require("../controllers/watchlistController");

// All watchlist routes require authentication
router.post("/", authMiddleware, addToWatchlist);
router.get("/", authMiddleware, getWatchlist);
router.get("/check/:movieId", authMiddleware, checkWatchlist);
router.delete("/:movieId", authMiddleware, removeFromWatchlist);

module.exports = router;
