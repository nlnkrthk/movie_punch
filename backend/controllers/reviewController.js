const Review = require("../models/Review");

// POST /api/reviews — create or update a review
exports.addReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const userId = req.user;

    if (!movieId || !rating || !reviewText) {
      return res.status(400).json({ message: "movieId, rating, and reviewText are required" });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({ message: "Rating must be between 1 and 10" });
    }

    const review = await Review.findOneAndUpdate(
      { userId, movieId },
      { rating, reviewText },
      { upsert: true, new: true, runValidators: true }
    );

    // Populate user name before returning
    await review.populate("userId", "name");

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this movie" });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:movieId — get all reviews for a movie
exports.getReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId: Number(movieId) })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/:movieId/stats — get average rating and count
exports.getReviewStats = async (req, res) => {
  try {
    const { movieId } = req.params;
    const stats = await Review.aggregate([
      { $match: { movieId: Number(movieId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({ avgRating: 0, count: 0 });
    }

    res.json({
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      count: stats[0].count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reviews/:id — delete own review
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user;
    const reviewId = req.params.id;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ message: "Review not found or not authorized" });
    }

    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
