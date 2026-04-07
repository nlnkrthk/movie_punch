const Watchlist = require("../models/Watchlist");

// POST /api/watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user;

    const exists = await Watchlist.findOne({ userId, movieId });
    if (exists) {
      return res.status(400).json({ message: "Movie already in watchlist" });
    }

    const entry = await Watchlist.create({ userId, movieId });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const userId = req.user;
    const watchlist = await Watchlist.find({ userId }).sort({ createdAt: -1 });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/watchlist/:movieId
exports.removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user;
    const movieId = req.params.movieId;

    const entry = await Watchlist.findOneAndDelete({ userId, movieId });

    if (!entry) {
      return res.status(404).json({ message: "Watchlist entry not found" });
    }

    res.json({ message: "Removed from watchlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/watchlist/check/:movieId
exports.checkWatchlist = async (req, res) => {
  try {
    const userId = req.user;
    const movieId = req.params.movieId;

    const exists = await Watchlist.findOne({ userId, movieId: Number(movieId) });
    res.json({ inWatchlist: !!exists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
