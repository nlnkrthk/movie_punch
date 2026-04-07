const Favorite = require("../models/Favorite");

// POST /api/favorites
exports.addFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user;

    const exists = await Favorite.findOne({ userId, movieId });
    if (exists) {
      return res.status(400).json({ message: "Movie already in favorites" });
    }

    const favorite = await Favorite.create({ userId, movieId });
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/favorites
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user;
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/favorites/:movieId
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user;
    const movieId = req.params.movieId;

    const favorite = await Favorite.findOneAndDelete({ userId, movieId });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Favorite removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
