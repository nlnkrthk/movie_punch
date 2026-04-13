import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import GenreBar from "../components/GenreBar"
import LoadMoreButton from "../components/LoadMoreButton"
import MovieListItem from "../components/MovieListItem"
import SearchBar from "../components/SearchBar"
import SortPanel from "../components/SortPanel"
import MovieAssistant from "../components/MovieAssistant"
import Shuffle from "../components/Shuffle"
import { discoverMovies, getGenres, searchMovies, searchPerson } from "../services/tmdb"
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
  const location = useLocation()
  const autoExpandChat = location.state?.autoExpandChat || false

  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("ep_searchQuery") || "")
  const [searchMode, setSearchMode] = useState(() => sessionStorage.getItem("ep_searchMode") || "title")
  const [selectedGenres, setSelectedGenres] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ep_selectedGenres")) || [] } catch { return [] }
  })
  const [sortOption, setSortOption] = useState(() => sessionStorage.getItem("ep_sortOption") || "popularity")
  const [sortOrder, setSortOrder] = useState(() => sessionStorage.getItem("ep_sortOrder") || "desc")
  const [activePerson, setActivePerson] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ep_activePerson")) || null } catch { return null }
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreAnchor = useRef(0)

  const [debouncedQuery, setDebouncedQuery] = useState(() => sessionStorage.getItem("ep_searchQuery") || "")

  useEffect(() => {
    sessionStorage.setItem("ep_searchQuery", searchQuery)
    sessionStorage.setItem("ep_searchMode", searchMode)
    sessionStorage.setItem("ep_selectedGenres", JSON.stringify(selectedGenres))
    sessionStorage.setItem("ep_sortOption", sortOption)
    sessionStorage.setItem("ep_sortOrder", sortOrder)
    sessionStorage.setItem("ep_activePerson", JSON.stringify(activePerson))
  }, [searchQuery, searchMode, selectedGenres, sortOption, sortOrder, activePerson])

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
  }, [debouncedQuery, selectedGenres, sortOption, sortOrder, activePerson, searchMode])

  useEffect(() => {
    let cancelled = false
    async function loadMovies() {
      setError("")
      if (page === 1) setLoading(true)
      else setIsLoadingMore(true)

      try {
        const sortBy = toTmdbSort(sortOption, sortOrder)
        let data = { results: [], total_pages: 0 }

        // Only explicitly allow upcoming movies if they sort by release date
        const today = new Date().toISOString().split("T")[0]
        const lteDate = sortOption === "release_date" ? "" : today

        if (debouncedQuery.length > 0) {
          if (searchMode === "person") {
            const pData = await searchPerson(debouncedQuery)
            if (pData.results && pData.results.length > 0) {
              const bestMatch = pData.results[0]
              data = await discoverMovies({
                page,
                genreId: selectedGenres.join(","),
                sortBy,
                personId: bestMatch.id,
                lteDate,
              })
              // Sync the active person badge visually
              if (!cancelled && (!activePerson || activePerson.id !== bestMatch.id)) {
                setActivePerson({ id: bestMatch.id, name: bestMatch.name })
              }
            } else {
              if (!cancelled && activePerson) setActivePerson(null)
            }
          } else {
            // Traditional Title Search
            data = await searchMovies(debouncedQuery, page, sortBy)
            if (!cancelled && activePerson) setActivePerson(null) // title search overrides person
          }
        } else {
          data = await discoverMovies({
            page,
            genreId: selectedGenres.join(","),
            sortBy,
            personId: activePerson?.id || "",
            lteDate,
          })
        }

        if (cancelled) return
        let incoming = data.results || []

        // In-memory filter for Title searches which don't support API level date bounds
        if (sortOption !== "release_date") {
          incoming = incoming.filter((m) => !m.release_date || m.release_date <= today)
        }

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
  }, [debouncedQuery, page, selectedGenres, sortOption, sortOrder, activePerson, searchMode])

  const handleApplyFilters = async (instructions) => {
    let isPersonFound = false

    // 1. Handle Person
    if (instructions.person) {
      try {
        const pData = await searchPerson(instructions.person)
        if (pData.results && pData.results.length > 0) {
          setActivePerson({ id: pData.results[0].id, name: pData.results[0].name })
          isPersonFound = true
        } else {
          setActivePerson(null)
        }
      } catch (err) {
        console.error("Failed to fetch person context for:", instructions.person)
        setActivePerson(null)
      }
    } else {
      setActivePerson(null)
    }

    // 2. Handle Search Query
    // Discover API (used for person/genre) requires search to be empty.
    if (isPersonFound) {
      setSearchQuery("")
    } else if (instructions.search) {
      setSearchQuery(instructions.search)
    } else {
      setSearchQuery("")
    }

    // 3. Handle Genres
    // Title search API ignores genres, so we clear it if there's a search term
    if (instructions.search && !isPersonFound) {
      setSelectedGenres([])
    } else if (instructions.genres && instructions.genres.length > 0) {
      const mappedIds = instructions.genres
        .map((gName) => {
          const match = genres.find((g) => g.name.toLowerCase() === gName.toLowerCase())
          return match ? String(match.id) : null
        })
        .filter(Boolean)
      setSelectedGenres(mappedIds)
    } else {
      setSelectedGenres([])
    }

    // 4. Handle Sorting
    if (instructions.sort_by) {
      setSortOption(instructions.sort_by)
    }
    if (instructions.order) {
      setSortOrder(instructions.order.toLowerCase())
    }
  }

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])

  return (
    <section className="explore-page">
      <div className="explore-discover-banner neo-texture">
        <h1>
          <Shuffle
            text="Discover"
            shuffleDirection="right"
            duration={0.7}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.04}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop={false}
            loopDelay={0}
            tag="span"
          />
        </h1>
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
        <MovieAssistant genres={genres} onApplyFilters={handleApplyFilters} autoFocus={autoExpandChat} />
        
        <div className="explore-top-sticky">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            searchMode={searchMode} 
            onSearchModeChange={setSearchMode} 
          />
          
          {activePerson && (
             <div className="explore-person-badge">
                <span>Filtering by: <strong>{activePerson.name}</strong></span>
                <button aria-label="Clear Person" onClick={() => setActivePerson(null)}>✕</button>
             </div>
          )}

          <GenreBar genres={genres} selectedGenres={selectedGenres} onSelect={setSelectedGenres} />
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
