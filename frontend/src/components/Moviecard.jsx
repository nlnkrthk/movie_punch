import "../css/MovieCard.css"
import { useMovieContext } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import heartEmpty from "../assets/heart-empty.png"
import heartFilled from "../assets/heart-filled.png"
import watchlistEmpty from "../assets/not-watchlisted.png"
import watchlistFilled from "../assets/watchlisted.png"

const API_BASE = "http://localhost:5000/api"

function MovieCard({ movie, onOpenDetails }) {
  const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext()
  const { token, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const favorited = isFavorite(movie.id)
  const [inWatchlist, setInWatchlist] = useState(false)

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image"

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
  const overview = movie.overview || "No description available"

  useEffect(() => {
    if (!isLoggedIn || !token || movie?.id == null) {
      setInWatchlist(false)
      return
    }

    let cancelled = false
    async function checkWatchlist() {
      try {
        const res = await axios.get(`${API_BASE}/watchlist/check/${movie.id}`, {
          headers: { Authorization: token },
        })
        if (!cancelled) setInWatchlist(!!res.data?.inWatchlist)
      } catch {
        if (!cancelled) setInWatchlist(false)
      }
    }

    checkWatchlist()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, token, movie?.id])

  function onFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      navigate('/signin')
      return
    }
    if (favorited) {
      removeFromFavorites(movie.id)
    } else {
      addToFavorites(movie)
    }
  }

  async function onWatchlistClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      navigate('/signin')
      return
    }
    if (!token || movie?.id == null) return
    try {
      if (inWatchlist) {
        await axios.delete(`${API_BASE}/watchlist/${movie.id}`, {
          headers: { Authorization: token },
        })
        setInWatchlist(false)
      } else {
        await axios.post(
          `${API_BASE}/watchlist`,
          { movieId: Number(movie.id) },
          { headers: { Authorization: token } }
        )
        setInWatchlist(true)
      }
    } catch {
      // Silent fail for quick toggle control
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
      <div className="movie-poster-wrap">
        <img src={posterUrl} alt={movie.title} loading="lazy" className="movie-poster" />
      </div>
      <div className="movie-info">
        <div className="movie-title-row">
          <h3 className="movie-title">{movie.title || "Unknown Title"}</h3>
          <div className="movie-action-btns">
            <button
              type="button"
              className={`mc-fav-btn ${favorited ? "active" : ""}`}
              onClick={onFavoriteClick}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <img
                src={favorited ? heartFilled : heartEmpty}
                alt={favorited ? "Favorited" : "Not favorited"}
                className="mc-heart-icon"
              />
            </button>
            <button
              type="button"
              className={`mc-watch-btn ${inWatchlist ? "active" : ""}`}
              onClick={onWatchlistClick}
              aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <img
                src={inWatchlist ? watchlistFilled : watchlistEmpty}
                alt={inWatchlist ? "In watchlist" : "Not in watchlist"}
                className="mc-watch-icon"
              />
            </button>
          </div>
        </div>
        <p className="movie-year">{releaseYear}</p>
        <p className="movie-rating">★ {rating}</p>
        <p className="movie-description">{overview}</p>
      </div>
    </article>
  )
}

export default MovieCard