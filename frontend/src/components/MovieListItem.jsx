import { useMovieContext } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import "../css/MovieListItem.css"

function MovieListItem({ movie, onOpenDetails }) {
  const { addToFavorites, removeFromFavorites, isFavorite, isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieContext()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const favorited = isFavorite(movie.id)
  const inWatchlist = isInWatchlist(movie.id)
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Poster"

  function openDetails() {
    if (typeof onOpenDetails === "function") {
      onOpenDetails(movie)
      return
    }
    navigate(`/movie/${movie.id}`)
  }

  function toggleWatchlist(e) {
    e.stopPropagation()
    if (!isLoggedIn) {
      navigate('/signin')
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie.id)
    }
  }

  return (
    <article
      className="movie-list-item movie-list-item-clickable"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openDetails()
        }
      }}
    >
      <img src={poster} alt={movie.title} loading="lazy" className="movie-list-poster" />
      <div className="movie-list-content">
        <h3>
          {movie.title} <span>({year})</span>
        </h3>
        <p className="movie-list-rating">Rating: {rating} ★</p>
        <p className="movie-list-overview">{movie.overview || "No description available."}</p>
        <div className="movie-list-actions">
          <button
            type="button"
            className={`movie-list-fav ${favorited ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isLoggedIn) {
                navigate('/signin')
                return
              }
              favorited ? removeFromFavorites(movie.id) : addToFavorites(movie)
            }}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {favorited ? "♥ Favorited" : "♡ Favorite"}
          </button>
          <button
            type="button"
            className={`movie-list-watch ${inWatchlist ? "active" : ""}`}
            onClick={toggleWatchlist}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {inWatchlist ? "✓ Watchlisted" : "📋 Watchlist"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default MovieListItem
