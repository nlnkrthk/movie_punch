import { useEffect, useMemo, useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMovieContext } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { getMovieDetails, getSimilarMovies, getWatchProviders } from "../services/tmdb"
import DetailsHorizontalCarousel from "../components/DetailsHorizontalCarousel"
import MovieCarousel from "../components/MovieCarousel"
import axios from "axios"
import "../css/MovieDetailsPage.css"

const API_BASE = import.meta.env.VITE_API_BASE_URL

function pickCrew(credits, jobs) {
  const crew = credits?.crew || []
  return jobs.flatMap((job) => crew.filter((c) => c.job === job))
}

function uniqueNames(people) {
  const seen = new Set()
  return people
    .filter((p) => {
      if (!p?.name || seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
    .map((p) => p.name)
}

function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-rating-input" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || value) ? "star-filled" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} out of 10`}
        >
          ★
        </button>
      ))}
      <span className="star-rating-value">{value > 0 ? `${value}/10` : "—/10"}</span>
    </div>
  )
}

function ReviewCard({ review, currentUserId, onDelete }) {
  const userName = review.userId?.name || "Anonymous"
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const isOwn = currentUserId && review.userId?._id === currentUserId

  return (
    <article className="review-card">
      <div className="review-card-header">
        <div className="review-card-avatar">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="review-card-meta">
          <span className="review-card-name">{userName}</span>
          <span className="review-card-date">{date}</span>
        </div>
        <span className="review-card-rating">{review.rating}/10 ★</span>
      </div>
      <p className="review-card-text">{review.reviewText}</p>
      {isOwn && (
        <div className="review-card-footer">
          <button
            type="button"
            className="review-delete-btn"
            onClick={() => onDelete(review._id)}
          >
            ✕ Delete
          </button>
        </div>
      )}
    </article>
  )
}

function MovieDetailsPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const { addToFavorites, removeFromFavorites, isFavorite, isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieContext()
  const { token, isLoggedIn, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [movie, setMovie] = useState(null)
  const [similar, setSimilar] = useState([])
  const [error, setError] = useState("")

  // Watch providers
  const [providers, setProviders] = useState(null)

  const inWatchlist = isInWatchlist(movieId)

  // Reviews
  const [reviews, setReviews] = useState([])
  const [communityStats, setCommunityStats] = useState({ avgRating: 0, count: 0 })
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState("")

  // Load movie details + similar + watch providers
  useEffect(() => {
    let cancelled = false
    async function loadDetails() {
      setLoading(true)
      setError("")
      try {
        const [details, similarData, watchData] = await Promise.all([
          getMovieDetails(movieId),
          getSimilarMovies(movieId, 1),
          getWatchProviders(movieId).catch(() => null),
        ])
        if (!cancelled) {
          setMovie(details)
          setSimilar(similarData.results || [])
          // Get providers for IN region first, fallback to US
          const regionData = watchData?.results?.IN || watchData?.results?.US || null
          setProviders(regionData)
        }
      } catch {
        if (!cancelled) setError("Could not load movie details.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDetails()
    return () => {
      cancelled = true
    }
  }, [movieId])

  // Load reviews + stats
  const loadReviews = useCallback(async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/reviews/${movieId}`),
        axios.get(`${API_BASE}/reviews/${movieId}/stats`),
      ])
      setReviews(reviewsRes.data)
      setCommunityStats(statsRes.data)
    } catch {
      // Silent fail — reviews are supplementary
    }
  }, [movieId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  // Check if user already has a review, pre-fill form
  useEffect(() => {
    if (!user || !reviews.length) return
    const own = reviews.find((r) => r.userId?._id === user.id)
    if (own) {
      setReviewRating(own.rating)
      setReviewText(own.reviewText)
    } else {
      setReviewRating(0)
      setReviewText("")
    }
  }, [reviews, user])

  // Watchlist toggle
  const toggleWatchlist = () => {
    if (!isLoggedIn) {
      navigate('/signin')
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(movieId)
    } else {
      addToWatchlist(movieId)
    }
  }

  // Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) return
    if (reviewRating < 1 || reviewRating > 10) {
      setReviewError("Please select a rating (1–10)")
      return
    }
    if (!reviewText.trim()) {
      setReviewError("Please write a review")
      return
    }
    setReviewSubmitting(true)
    setReviewError("")
    try {
      await axios.post(
        `${API_BASE}/reviews`,
        { movieId: Number(movieId), rating: reviewRating, reviewText: reviewText.trim() },
        { headers: { Authorization: token } }
      )
      await loadReviews()
      // Don't clear form — it shows current review
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review")
    } finally {
      setReviewSubmitting(false)
    }
  }

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`${API_BASE}/reviews/${reviewId}`, {
        headers: { Authorization: token },
      })
      setReviewRating(0)
      setReviewText("")
      await loadReviews()
    } catch {
      // Silent
    }
  }

  const trailerUrl = useMemo(() => {
    const list = movie?.videos?.results || []
    const trailer = list.find((v) => v.site === "YouTube" && v.type === "Trailer")
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : `https://www.themoviedb.org/movie/${movieId}`
  }, [movie, movieId])

  const directors = useMemo(() => {
    if (!movie?.credits) return []
    const d = pickCrew(movie.credits, ["Director"])
    return uniqueNames(d).slice(0, 6)
  }, [movie])

  const writers = useMemo(() => {
    if (!movie?.credits) return []
    const w = pickCrew(movie.credits, ["Writer", "Screenplay", "Story"])
    return uniqueNames(w).slice(0, 8)
  }, [movie])

  const starNames = useMemo(() => {
    const cast = movie?.credits?.cast || []
    return cast.slice(0, 8).map((p) => p.name).filter(Boolean)
  }, [movie])

  const isFav = movie ? isFavorite(movie.id) : false
  const year = movie?.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const backdropUrl = movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : ""
  const poster = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Poster"

  const tmdbVoteCount = movie?.vote_count ?? 0
  const userHasReview = user && reviews.some((r) => r.userId?._id === user.id)

  // Collect all streaming types into one flat list
  const streamingProviders = useMemo(() => {
    if (!providers) return []
    const all = []
    const seen = new Set()
    const types = ["flatrate", "rent", "buy", "free"]
    for (const type of types) {
      if (providers[type]) {
        for (const p of providers[type]) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id)
            all.push({ ...p, type })
          }
        }
      }
    }
    return all
  }, [providers])

  if (loading) {
    return (
      <section className="movie-details loading">
        <div className="details-skeleton details-skeleton-hero" />
        <div className="details-skeleton details-skeleton-body" />
      </section>
    )
  }

  if (error || !movie) {
    return (
      <section className="movie-details-error">
        <p>{error || "Movie not found."}</p>
        <button type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </section>
    )
  }

  return (
    <section className="movie-details">
      <header className="movie-details-hero">
        <div className="movie-details-hero-media">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="movie-details-backdrop-img"
              loading="eager"
            />
          ) : null}
          <div className="movie-details-hero-overlay" aria-hidden="true" />
        </div>
        <button type="button" className="movie-details-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      <section className="movie-details-profile">
        <img src={poster} alt={movie.title} className="movie-details-poster" />

        <div className="movie-details-main">
          <div className="movie-details-main-head">
            <h1>
              {movie.title} <span className="movie-details-year">({year})</span>
            </h1>
            <div className="movie-details-score-row">
              <div className="rating-source-group">
                <span className="rating-source-label">TMDB</span>
                <span className="movie-details-rating">{(movie.vote_average || 0).toFixed(1)}/10</span>
                <span className="movie-details-reviews">
                  {tmdbVoteCount.toLocaleString()} review{tmdbVoteCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="rating-source-group rating-source-community">
                <span className="rating-source-label community-label">Community</span>
                <span className="movie-details-rating community-rating">
                  {communityStats.count > 0 ? `${communityStats.avgRating.toFixed(1)}/10` : "—/10"}
                </span>
                <span className="movie-details-reviews">
                  {communityStats.count} review{communityStats.count === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <dl className="movie-details-credits">
            <div className="credit-block credit-directors">
              <dt>Directors</dt>
              <dd>{directors.length ? directors.join(", ") : "—"}</dd>
            </div>
            <div className="credit-block credit-writers">
              <dt>Writers</dt>
              <dd>{writers.length ? writers.join(", ") : "—"}</dd>
            </div>
            <div className="credit-block credit-stars">
              <dt>Stars</dt>
              <dd>{starNames.length ? starNames.join(", ") : "—"}</dd>
            </div>
          </dl>

          <div className="movie-details-meta">
            {(movie.genres || []).map((g, i) => (
              <span
                key={g.id}
                className={`meta-badge meta-badge-tilt-${(i % 3) + 1}`}
              >
                {g.name}
              </span>
            ))}
            <span className="meta-badge meta-badge-runtime">{movie.runtime || "N/A"} min</span>
          </div>

          <div className="movie-details-overview-wrap neo-texture">
            <p className="movie-details-overview-label">Synopsis</p>
            <p className="movie-details-overview">{movie.overview || "No synopsis available."}</p>
          </div>

          {/* Where to Watch */}
          {streamingProviders.length > 0 && (
            <div className="where-to-watch-section">
              <p className="where-to-watch-label">Where to Watch</p>
              <div className="where-to-watch-providers">
                {streamingProviders.map((p) => (
                  <div key={p.provider_id} className="provider-chip" title={`${p.provider_name} (${p.type})`}>
                    <img
                      src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                      alt={p.provider_name}
                      className="provider-logo"
                      loading="lazy"
                    />
                    <span className="provider-name">{p.provider_name}</span>
                    <span className={`provider-type-badge provider-type-${p.type}`}>
                      {p.type === "flatrate" ? "Stream" : p.type === "free" ? "Free" : p.type === "rent" ? "Rent" : "Buy"}
                    </span>
                  </div>
                ))}
              </div>
              {providers?.link && (
                <a
                  href={providers.link}
                  className="where-to-watch-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View all options on JustWatch →
                </a>
              )}
            </div>
          )}

          <div className="movie-details-actions">
            <a href={trailerUrl} className="details-btn" target="_blank" rel="noreferrer">
              ▶ Watch Trailer
            </a>
            <button
              type="button"
              className="details-btn secondary"
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/signin')
                  return
                }
                isFav ? removeFromFavorites(movie.id) : addToFavorites(movie)
              }}
            >
              {isFav ? "♥ Favorited" : "♡ Add to Favorites"}
            </button>
            <button
              type="button"
              className={`details-btn ${inWatchlist ? "watchlist-active" : "watchlist-btn"}`}
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
            >
              {watchlistLoading
                ? "..."
                : inWatchlist
                  ? "✓ On Watchlist"
                  : "📋 Add to Watchlist"}
            </button>
          </div>
        </div>
      </section>

      <DetailsHorizontalCarousel title="Cast">
        {(movie.credits?.cast || []).slice(0, 20).map((person) => {
          const profile = person.profile_path
            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
            : "https://via.placeholder.com/185x278?text=No+Image"
          return (
            <article className="cast-card details-h-item" key={person.cast_id ?? person.id}>
              <img src={profile} alt={person.name} loading="lazy" />
              <h3>{person.name}</h3>
              <p>{person.character}</p>
            </article>
          )
        })}
      </DetailsHorizontalCarousel>

      {/* Reviews Section */}
      <section className="reviews-section" id="reviews">
        <div className="reviews-section-header">
          <h2 className="reviews-section-title">Community Reviews</h2>
          <span className="reviews-section-count">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
        </div>

        {/* Review Form */}
        {isLoggedIn ? (
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="review-form-header">
              <span className="review-form-label">
                {userHasReview ? "Update your review" : "Write a review"}
              </span>
            </div>
            <StarRatingInput value={reviewRating} onChange={setReviewRating} />
            <textarea
              className="review-textarea"
              placeholder="Share your thoughts about this movie..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
              rows={4}
            />
            {reviewError && <p className="review-form-error">{reviewError}</p>}
            <button
              type="submit"
              className="review-submit-btn"
              disabled={reviewSubmitting}
            >
              {reviewSubmitting
                ? "Submitting..."
                : userHasReview
                  ? "Update Review"
                  : "Post Review"}
            </button>
          </form>
        ) : (
          <div className="review-signin-prompt">
            <p>Sign in to leave a review and rating</p>
            <button
              type="button"
              className="details-btn"
              onClick={() => navigate("/signin")}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                currentUserId={user?.id}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        ) : (
          <div className="reviews-empty">
            <p>No reviews yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </section>

      {similar.length > 0 ? (
        <div className="movie-details-similar">
          <MovieCarousel title="Similar Movies" movies={similar} />
        </div>
      ) : null}
    </section>
  )
}

export default MovieDetailsPage
