import { useEffect, useMemo, useRef, useState } from "react"
import GenreBar from "../components/GenreBar"
import LoadMoreButton from "../components/LoadMoreButton"
import MovieListItem from "../components/MovieListItem"
import SearchBar from "../components/SearchBar"
import SortPanel from "../components/SortPanel"
import { discoverMovies, getGenres, searchMovies } from "../services/tmdb"
import "../css/ExplorePage.css"

const DEBOUNCE_MS = 400

function toTmdbSort(sortOption, sortOrder) {
  if (sortOption === "alphabetical") {
    return `original_title.${sortOrder}`
  }
  if (sortOption === "title") {
    return `title.${sortOrder}`
  }
  if (sortOption === "runtime") {
    return `popularity.${sortOrder}`
  }
  return `${sortOption}.${sortOrder}`
}

function ExplorePage() {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [sortOption, setSortOption] = useState("popularity")
  const [sortOrder, setSortOrder] = useState("desc")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreAnchor = useRef(0)

  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    getGenres()
      .then((data) => setGenres(data.genres || []))
      .catch(() => setGenres([]))
  }, [])

  useEffect(() => {
    setPage(1)
    setMovies([])
    setHasMore(true)
  }, [debouncedQuery, selectedGenre, sortOption, sortOrder])

  useEffect(() => {
    let cancelled = false
    async function loadMovies() {
      setError("")
      if (page === 1) setLoading(true)
      else setIsLoadingMore(true)

      try {
        const sortBy = toTmdbSort(sortOption, sortOrder)
        const data =
          debouncedQuery.length > 0
            ? await searchMovies(debouncedQuery, page, sortBy)
            : await discoverMovies({ page, genreId: selectedGenre, sortBy })

        if (cancelled) return
        const incoming = data.results || []
        setMovies((prev) => (page === 1 ? incoming : [...prev, ...incoming]))
        setHasMore(page < (data.total_pages || 1) && incoming.length > 0)
      } catch {
        if (!cancelled) setError("Unable to load movies right now.")
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsLoadingMore(false)
          if (page > 1) {
            requestAnimationFrame(() => window.scrollTo({ top: loadMoreAnchor.current }))
          }
        }
      }
    }
    loadMovies()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page, selectedGenre, sortOption, sortOrder])

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  return (
    <section className="explore-page">
      <div className="explore-discover-banner neo-texture">
        <h1>Discover</h1>
        <p>Search, filter by genre, sort hard, then load more.</p>
      </div>

      <div className="explore-mobile-sort">
        <SortPanel
          mobile
          sortOption={sortOption}
          sortOrder={sortOrder}
          onSortOptionChange={setSortOption}
          onSortOrderChange={setSortOrder}
        />
      </div>

      <aside className="explore-left-col">
        <div className="explore-sticky-panel">
          <SortPanel
            sortOption={sortOption}
            sortOrder={sortOrder}
            onSortOptionChange={setSortOption}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </aside>

      <main className="explore-main-col">
        <div className="explore-top-sticky">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <GenreBar genres={genres} selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
        </div>

        {error ? <p className="explore-error">{error}</p> : null}

        <div className="explore-list">
          {loading
            ? skeletons.map((id) => <div key={id} className="movie-list-skeleton" aria-hidden="true" />)
            : movies.map((movie) => <MovieListItem key={`${movie.id}-${movie.title}`} movie={movie} />)}
        </div>

        <div className="explore-loadmore-wrap">
          <LoadMoreButton
            onClick={() => {
              loadMoreAnchor.current = window.scrollY
              setPage((prev) => prev + 1)
            }}
            loading={isLoadingMore}
            disabled={!hasMore || loading}
          />
        </div>
      </main>
    </section>
  )
}

export default ExplorePage
