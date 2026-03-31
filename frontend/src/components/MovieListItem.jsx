import { useMovieContext } from "../context/MovieContext"
import "../css/MovieListItem.css"

function MovieListItem({ movie }) {
  const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext()
  const favorited = isFavorite(movie.id)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Poster"

  return (
    <article className="movie-list-item">
      <img src={poster} alt={movie.title} loading="lazy" className="movie-list-poster" />
      <div className="movie-list-content">
        <h3>
          {movie.title} <span>({year})</span>
        </h3>
        <p className="movie-list-rating">Rating: {rating} ★</p>
        <p className="movie-list-overview">{movie.overview || "No description available."}</p>
        <button
          type="button"
          className={`movie-list-fav ${favorited ? "active" : ""}`}
          onClick={() => (favorited ? removeFromFavorites(movie.id) : addToFavorites(movie))}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          {favorited ? "♥ Favorited" : "♡ Favorite"}
        </button>
      </div>
    </article>
  )
}

export default MovieListItem
