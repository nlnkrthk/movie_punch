import "../css/MovieCard.css"
import { useMovieContext } from "../context/MovieContext"
import { useNavigate } from "react-router-dom"

function MovieCard({ movie, onOpenDetails }) {
  const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext()
  const navigate = useNavigate()
  const favorited = isFavorite(movie.id)

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image"

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
  const overview = movie.overview || "No description available"

  function onFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (favorited) {
      removeFromFavorites(movie.id)
    } else {
      addToFavorites(movie)
    }
  }

  function openDetails() {
    if (typeof onOpenDetails === "function") {
      onOpenDetails(movie)
      return
    }
    navigate(`/movie/${movie.id}`)
  }

  return (
    <article
      className="movie-card movie-card-clickable"
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
      <img src={posterUrl} alt={movie.title} loading="lazy" className="movie-poster" />
      <div className="movie-info">
        <h3 className="movie-title">{movie.title || "Unknown Title"}</h3>
        <p className="movie-year">{releaseYear}</p>
        <p className="movie-rating">★ {rating}</p>
        <p className="movie-description">{overview}</p>
      </div>
      <div className="movie-overlay">
        <button
          type="button"
          className={`favorite-button ${favorited ? "active" : ""}`}
          onClick={onFavoriteClick}
        >
          {favorited ? "♥" : "♡"}
        </button>
      </div>
    </article>
  )
}

export default MovieCard