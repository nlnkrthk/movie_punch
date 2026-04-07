const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    reviewText: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

// One review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
