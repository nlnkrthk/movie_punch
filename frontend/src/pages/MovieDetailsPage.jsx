import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMovieContext } from "../context/MovieContext"
import { getMovieDetails, getSimilarMovies } from "../services/tmdb"
import DetailsHorizontalCarousel from "../components/DetailsHorizontalCarousel"
import MovieCarousel from "../components/MovieCarousel"
import "../css/MovieDetailsPage.css"

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

function MovieDetailsPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext()
  const [loading, setLoading] = useState(true)
  const [movie, setMovie] = useState(null)
  const [similar, setSimilar] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function loadDetails() {
      setLoading(true)
      setError("")
      try {
        const [details, similarData] = await Promise.all([
          getMovieDetails(movieId),
          getSimilarMovies(movieId, 1),
        ])
        if (!cancelled) {
          setMovie(details)
          setSimilar(similarData.results || [])
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

  const voteCount = movie?.vote_count ?? 0

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
              <span className="movie-details-rating">{(movie.vote_average || 0).toFixed(1)}/10</span>
              <span className="movie-details-reviews">
                {voteCount.toLocaleString()} review{voteCount === 1 ? "" : "s"}
              </span>
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

          <div className="movie-details-actions">
            <a href={trailerUrl} className="details-btn" target="_blank" rel="noreferrer">
              Watch Trailer
            </a>
            <button
              type="button"
              className="details-btn secondary"
              onClick={() => (isFav ? removeFromFavorites(movie.id) : addToFavorites(movie))}
            >
              {isFav ? "♥ Favorited" : "♡ Add to Favorites"}
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

      {similar.length > 0 ? (
        <div className="movie-details-similar">
          <MovieCarousel title="Similar Movies" movies={similar} />
        </div>
      ) : null}
    </section>
  )
}

export default MovieDetailsPage
