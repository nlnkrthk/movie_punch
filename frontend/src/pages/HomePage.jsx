import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useMovieContext } from "../context/MovieContext"
import HeroBanner from "../components/HeroBanner"
import MovieCarousel from "../components/MovieCarousel"
import {
  discoverMovies,
  getMovieDetails,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "../services/tmdb"
import TextType from "../components/TextType"
import "../css/HomePage.css"

const Antigravity = lazy(() => import("../components/Antigravity"))

const HERO_ROTATE_MS = 10_000

function HomePage() {
  const { isLoggedIn } = useAuth()
  const { favorites, watchlist } = useMovieContext()
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [trendingData, popularData, topRatedData, upcomingData] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies(),
          getTopRatedMovies(),
          getUpcomingMovies(),
        ])

        if (cancelled) return
        setTrending(trendingData.results || [])
        setPopular(popularData.results || [])
        setTopRated(topRatedData.results || [])
        setUpcoming(upcomingData.results || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (popular.length === 0) return
    setHeroIndex(0)
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % popular.length)
    }, HERO_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [popular.length])

  const heroMovie = useMemo(() => {
    if (popular.length > 0) return popular[heroIndex] || popular[0]
    return trending[0]
  }, [heroIndex, popular, trending])

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommended([])
      return
    }

    const sourceIds = Array.from(
      new Set([
        ...favorites.map((item) => Number(item.movieId)),
        ...watchlist.map((item) => Number(item.movieId)),
      ])
    ).filter((id) => !Number.isNaN(id))

    if (sourceIds.length === 0) {
      setRecommended([])
      return
    }

    let cancelled = false
    async function loadRecommendations() {
      setLoadingRecommended(true)
      try {
        const sourceDetails = await Promise.all(sourceIds.map((id) => getMovieDetails(id)))
        if (cancelled) return

        const genreCounts = sourceDetails.reduce((acc, movie) => {
          ;(movie.genres || []).forEach((genre) => {
            acc[genre.id] = (acc[genre.id] || 0) + 1
          })
          return acc
        }, {})

        const topGenres = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genreId]) => genreId)

        const excluded = new Set(sourceIds)
        const picks = []

        for (const genreId of topGenres) {
          const data = await discoverMovies({
            page: 1,
            genreId,
            sortBy: "popularity.desc",
          })
          const results = data.results || []
          for (const movie of results) {
            if (!excluded.has(movie.id) && !picks.some((picked) => picked.id === movie.id)) {
              picks.push(movie)
            }
            if (picks.length >= 20) break
          }
          if (picks.length >= 20) break
        }

        if (!cancelled) setRecommended(picks)
      } catch {
        if (!cancelled) setRecommended([])
      } finally {
        if (!cancelled) setLoadingRecommended(false)
      }
    }

    loadRecommendations()
    return () => {
      cancelled = true
    }
  }, [favorites, watchlist, isLoggedIn])

  return (
    <section className="homepage">
      <HeroBanner movie={heroMovie} />
    <section className="homepage-ai-promo neo-texture" aria-label="AI movie exploration">
        <div className="homepage-ai-bg" style={{ width: '1080px', height: '1080px' }}>
          <Suspense fallback={<div className="antigravity-loading" />}>
            <Antigravity
              count={550}
              magnetRadius={7}
              ringRadius={5}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={2.5}
              lerpSpeed={0.1}
              color="#5ec997"
              autoAnimate
              particleVariance={1}
              rotationSpeed={0}
              depthFactor={1}
              pulseSpeed={3}
              particleShape="capsule"
              fieldStrength={15}
            />
          </Suspense>
        </div>
        <h2>Chat with an AI assistant to discover films by mood, genre blends, vibes, and hidden gems
          tailored to your taste.</h2>
        <Link to="/explore" state={{ autoExpandChat: true }} className="homepage-ai-btn">
          <TextType as="span" text="Explore Using AI" typingSpeed={40} cursorBlinkDuration={0.8} showCursor={true} cursorCharacter="_" />
        </Link>
      </section>
      {loading ? <p className="homepage-loading">Loading sections...</p> : null}
      {isLoggedIn && loadingRecommended ? (
        <p className="homepage-loading">Building your recommendations...</p>
      ) : null}
      {isLoggedIn && recommended.length > 0 ? (
        <MovieCarousel title="Recommended For You" movies={recommended} />
      ) : null}
      <MovieCarousel title="Trending Movies" movies={trending} />
      <MovieCarousel title="Popular Movies" movies={popular} />
      <MovieCarousel title="Top Rated Movies" movies={topRated} />
      <MovieCarousel title="Upcoming Movies" movies={upcoming} />
      <footer className="homepage-footer neo-texture" aria-label="Site footer">
        <div className="homepage-footer-grid">
          <section className="homepage-footer-brand">
            <p className="homepage-footer-title">Movie Punch</p>
            <p className="homepage-footer-copy">
              Discover, save, and review movies with a bold experience built for real film fans.
            </p>
          </section>

          <nav className="homepage-footer-nav" aria-label="Quick links">
            <p className="homepage-footer-heading">Quick Links</p>
            <div className="homepage-footer-links">
              <Link to="/home">Home</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/my-space">My Space</Link>
              <Link to="/signin">Account</Link>
            </div>
          </nav>

          <section className="homepage-footer-contact">
            <p className="homepage-footer-heading">Built With</p>
            <p className="homepage-footer-meta">React • TMDB API • Express</p>
          </section>
        </div>

        <div className="homepage-footer-bottom">
          <p>© {new Date().getFullYear()} Movie Punch</p>
          <p>Updated daily with TMDB data</p>
        </div>
      </footer>
    </section>
  )
}

export default HomePage
