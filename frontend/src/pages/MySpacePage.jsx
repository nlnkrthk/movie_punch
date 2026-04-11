import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useMovieContext } from "../context/MovieContext"
import { getGenres, getMovieDetails } from "../services/tmdb"
import MovieListItem from "../components/MovieListItem"
import SearchBar from "../components/SearchBar"
import GenreBar from "../components/GenreBar"
import "../css/MySpacePage.css"

const API_BASE = import.meta.env.VITE_API_BASE_URL

function formatActivityDate(value) {
  if (!value) return "Unknown time"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown time"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function toSortedFilteredMovies(movies, { searchQuery, selectedGenre, sortOption, sortOrder }) {
  const query = searchQuery.trim().toLowerCase()
  const direction = sortOrder === "asc" ? 1 : -1

  const filtered = movies.filter((movie) => {
    const title = (movie.title || "").toLowerCase()
    const overview = (movie.overview || "").toLowerCase()
    const matchesQuery = !query || title.includes(query) || overview.includes(query)
    const matchesGenre =
      !selectedGenre ||
      (movie.genres || []).some((genre) => String(genre.id) === String(selectedGenre))
    return matchesQuery && matchesGenre
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "newest") {
      const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0
      const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0
      return (aTime - bTime) * direction
    }
    if (sortOption === "title" || sortOption === "alphabetical") {
      return a.title.localeCompare(b.title) * direction
    }
    if (sortOption === "release_date") {
      const aTime = a.release_date ? new Date(a.release_date).getTime() : 0
      const bTime = b.release_date ? new Date(b.release_date).getTime() : 0
      return (aTime - bTime) * direction
    }
    if (sortOption === "vote_average") {
      return ((a.vote_average || 0) - (b.vote_average || 0)) * direction
    }
    if (sortOption === "vote_count") {
      return ((a.vote_count || 0) - (b.vote_count || 0)) * direction
    }
    return ((a.popularity || 0) - (b.popularity || 0)) * direction
  })

  return sorted
}

function MySpacePage() {
  const { user, token, isLoggedIn } = useAuth()
  const { favorites } = useMovieContext()
  const [activeTab, setActiveTab] = useState("favorites")
  const [watchlist, setWatchlist] = useState([])
  const [myReviews, setMyReviews] = useState([])
  const [movieMap, setMovieMap] = useState({})
  const [genres, setGenres] = useState([])
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [sortOption, setSortOption] = useState("newest")
  const [sortOrder, setSortOrder] = useState("desc")
  const [profilePic, setProfilePic] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null")
      const userId = storedUser?.id
      if (!userId) return null
      return localStorage.getItem(`pfp_${userId}`) || null
    } catch {
      return null
    }
  })
  const [bio, setBio] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null")
      const userId = storedUser?.id
      if (!userId) return ""
      return localStorage.getItem(`bio_${userId}`) || ""
    } catch {
      return ""
    }
  })
  const [editingBio, setEditingBio] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setWatchlist([])
      setMyReviews([])
      return
    }

    let cancelled = false
    async function loadUserData() {
      try {
        const [watchlistRes, reviewsRes] = await Promise.all([
          axios.get(`${API_BASE}/watchlist`, { headers: { Authorization: token } }),
          axios.get(`${API_BASE}/reviews/me`, { headers: { Authorization: token } }),
        ])
        if (!cancelled) {
          setWatchlist(watchlistRes.data || [])
          setMyReviews(reviewsRes.data || [])
        }
      } catch {
        if (!cancelled) {
          setWatchlist([])
          setMyReviews([])
        }
      }
    }

    loadUserData()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, token])

  useEffect(() => {
    getGenres()
      .then((data) => setGenres(data.genres || []))
      .catch(() => setGenres([]))
  }, [])

  const allMovieIds = useMemo(() => {
    const ids = new Set()
    favorites.forEach((item) => ids.add(Number(item.movieId)))
    watchlist.forEach((item) => ids.add(Number(item.movieId)))
    myReviews.forEach((item) => ids.add(Number(item.movieId)))
    return Array.from(ids).filter((id) => !Number.isNaN(id))
  }, [favorites, watchlist, myReviews])

  useEffect(() => {
    if (!isLoggedIn || allMovieIds.length === 0) {
      setMovieMap({})
      return
    }

    let cancelled = false
    setLoadingMovies(true)
    async function loadMovies() {
      try {
        const detailResults = await Promise.all(
          allMovieIds.map((movieId) => getMovieDetails(movieId))
        )
        if (!cancelled) {
          const map = detailResults.reduce((acc, movie) => {
            acc[movie.id] = movie
            return acc
          }, {})
          setMovieMap(map)
        }
      } catch {
        if (!cancelled) setMovieMap({})
      } finally {
        if (!cancelled) setLoadingMovies(false)
      }
    }

    loadMovies()
    return () => {
      cancelled = true
    }
  }, [allMovieIds, isLoggedIn])

  const favoriteRows = useMemo(
    () =>
      favorites
        .map((item) => {
          const movie = movieMap[item.movieId]
          if (!movie) return null
          return {
            ...movie,
            addedAt: item.createdAt || null,
          }
        })
        .filter(Boolean),
    [favorites, movieMap]
  )
  const watchlistRows = useMemo(
    () =>
      watchlist
        .map((item) => {
          const movie = movieMap[item.movieId]
          if (!movie) return null
          return {
            ...movie,
            addedAt: item.createdAt || null,
          }
        })
        .filter(Boolean),
    [watchlist, movieMap]
  )
  const filteredFavoriteMovies = useMemo(
    () =>
      toSortedFilteredMovies(favoriteRows, {
        searchQuery,
        selectedGenre,
        sortOption,
        sortOrder,
      }),
    [favoriteRows, searchQuery, selectedGenre, sortOption, sortOrder]
  )
  const filteredWatchlistMovies = useMemo(
    () =>
      toSortedFilteredMovies(watchlistRows, {
        searchQuery,
        selectedGenre,
        sortOption,
        sortOrder,
      }),
    [watchlistRows, searchQuery, selectedGenre, sortOption, sortOrder]
  )

  const activityItems = useMemo(() => {
    const favoriteEvents = favorites.map((item) => ({
      id: `fav-${item._id || item.movieId}-${item.createdAt || ""}`,
      type: "favorited",
      movieId: Number(item.movieId),
      timestamp: item.createdAt,
    }))
    const watchlistEvents = watchlist.map((item) => ({
      id: `watch-${item._id || item.movieId}-${item.createdAt || ""}`,
      type: "watchlisted",
      movieId: Number(item.movieId),
      timestamp: item.createdAt,
    }))
    const reviewEvents = myReviews.map((item) => ({
      id: `review-${item._id}`,
      type: "reviewed",
      movieId: Number(item.movieId),
      timestamp: item.createdAt,
      rating: item.rating,
      reviewText: item.reviewText,
    }))

    return [...favoriteEvents, ...watchlistEvents, ...reviewEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [favorites, watchlist, myReviews])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MP"

  function handleAvatarUpload() {
    if (!user?.id) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        window.alert("Image must be under 2MB.")
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        setProfilePic(dataUrl)
        try {
          localStorage.setItem(`pfp_${user.id}`, dataUrl)
        } catch {
          // Silent local storage failure
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function saveBio() {
    if (!user?.id) return
    try {
      localStorage.setItem(`bio_${user.id}`, bio.trim())
    } catch {
      // Silent local storage failure
    }
    setEditingBio(false)
  }

  if (!isLoggedIn) {
    return (
      <section className="my-space-empty neo-texture">
        <h2>My Space</h2>
        <p>
          <Link to="/signin">Sign in</Link> to see your profile, favorites, watchlist, and activity.
        </p>
      </section>
    )
  }

  return (
    <section className="my-space-page">
      <header className="my-space-profile-card">
        <span className="my-space-badge">My Space</span>
        <div className="my-space-profile-main">
          <button
            type="button"
            className="my-space-avatar-btn"
            onClick={handleAvatarUpload}
            aria-label="Upload profile picture"
          >
            <div className="my-space-avatar" aria-hidden="true">
              {profilePic ? <img src={profilePic} alt="Profile" className="my-space-avatar-img" /> : initials}
            </div>
            <span className="my-space-avatar-cta">✎ Edit Photo</span>
          </button>
          <div className="my-space-profile-copy">
            <h1>{user?.name || "Movie Fan"}</h1>
            <p>{user?.email || "No email available"}</p>
            <div className="my-space-bio-box">
              <p className="my-space-bio-label">About Me</p>
              {!bio?.trim() ? (
                <p className="my-space-bio-hint">Tell others your movie vibe.</p>
              ) : null}
              {editingBio ? (
                <>
                  <textarea
                    className="my-space-bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={220}
                    placeholder="Write a short movie-loving bio..."
                  />
                  <div className="my-space-bio-actions">
                    <button type="button" className="my-space-mini-btn" onClick={saveBio}>
                      Save
                    </button>
                    <button type="button" className="my-space-mini-btn ghost" onClick={() => setEditingBio(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="my-space-bio-text"
                  onClick={() => setEditingBio(true)}
                  aria-label="Edit profile description"
                >
                  {bio?.trim() ? bio : "✎ Add a short description about yourself"}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="my-space-stats">
          <article className="my-space-stat">
            <span className="my-space-stat-value">{favorites.length}</span>
            <span className="my-space-stat-label">Favorites</span>
          </article>
          <article className="my-space-stat">
            <span className="my-space-stat-value">{watchlist.length}</span>
            <span className="my-space-stat-label">Watchlist</span>
          </article>
          <article className="my-space-stat">
            <span className="my-space-stat-value">{myReviews.length}</span>
            <span className="my-space-stat-label">Reviews</span>
          </article>
        </div>
      </header>

      <nav className="my-space-tabs" aria-label="My Space sections">
        {[
          { id: "favorites", label: "Favorites" },
          { id: "watchlist", label: "Watchlist" },
          { id: "activity", label: "Activity" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`my-space-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="my-space-panel">
        {loadingMovies ? <p className="my-space-loading">Loading your movie universe...</p> : null}
        {activeTab !== "activity" ? (
          <div className="my-space-filters">
            <div className="my-space-filters-main">
              <div className="my-space-filters-search">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <GenreBar genres={genres} selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
            </div>
            <aside className="my-space-sort-aside">
              <h3>Sort</h3>
              <label htmlFor="my-space-sort-metric">Metric</label>
              <select
                id="my-space-sort-metric"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="newest">Newest Added</option>
                <option value="release_date">Release Date</option>
                <option value="vote_average">Vote Average</option>
                <option value="vote_count">Vote Count</option>
                <option value="popularity">Popularity</option>
                <option value="title">Title</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <div className="my-space-order-row">
                <p className="my-space-order-text">
                  Sort Order: <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
                </p>
                <button
                  type="button"
                  className="my-space-order-toggle"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  aria-label={`Sort order ${sortOrder === "asc" ? "ascending" : "descending"}. Click to toggle.`}
                  title="Toggle sort order"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        {activeTab === "favorites" && !loadingMovies ? (
          filteredFavoriteMovies.length > 0 ? (
            <div className="my-space-list">
              {filteredFavoriteMovies.map((movie) => (
                <MovieListItem key={`fav-movie-${movie.id}`} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="my-space-empty-message">No favorites match current filters.</p>
          )
        ) : null}

        {activeTab === "watchlist" && !loadingMovies ? (
          filteredWatchlistMovies.length > 0 ? (
            <div className="my-space-list">
              {filteredWatchlistMovies.map((movie) => (
                <MovieListItem key={`watch-movie-${movie.id}`} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="my-space-empty-message">No watchlist movies match current filters.</p>
          )
        ) : null}

        {activeTab === "activity" && !loadingMovies ? (
          activityItems.length > 0 ? (
            <div className="my-space-timeline" role="list" aria-label="User activity timeline">
              {activityItems.map((item) => {
                const movie = movieMap[item.movieId]
                return (
                  <article key={item.id} className="my-space-timeline-item" role="listitem">
                    <div className={`my-space-timeline-dot type-${item.type}`} aria-hidden="true">
                      {item.type === "favorited" ? "♥" : item.type === "watchlisted" ? "✓" : "★"}
                    </div>
                    <div className="my-space-timeline-card">
                      <p className="my-space-timeline-type">{item.type}</p>
                      <div className="my-space-timeline-top">
                        <div className="my-space-timeline-poster-wrap">
                          <img
                            src={
                              movie?.poster_path
                                ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                                : "https://via.placeholder.com/185x278?text=No+Poster"
                            }
                            alt={movie?.title || `Movie ${item.movieId}`}
                            className="my-space-timeline-poster"
                            loading="lazy"
                          />
                        </div>
                        <div className="my-space-timeline-content">
                          <h3>{movie?.title || `Movie #${item.movieId}`}</h3>
                          <p className="my-space-timeline-action">
                            You {item.type === "favorited" ? "favorited" : item.type === "watchlisted" ? "added to watchlist" : "reviewed"} this movie.
                          </p>
                          <p className="my-space-timeline-time">{formatActivityDate(item.timestamp)}</p>
                        </div>
                      </div>
                      {item.type === "reviewed" ? (
                        <p className="my-space-timeline-note">
                          Rated {item.rating}/10. {item.reviewText ? `"${item.reviewText}"` : ""}
                        </p>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="my-space-empty-message">No activity yet. Start by favoriting or reviewing a movie.</p>
          )
        ) : null}
      </div>
    </section>
  )
}

export default MySpacePage
