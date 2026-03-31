import { useEffect, useMemo, useState } from "react"
import HeroBanner from "../components/HeroBanner"
import MovieCarousel from "../components/MovieCarousel"
import {
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "../services/tmdb"
import "../css/HomePage.css"

const HERO_ROTATE_MS = 60_000

function HomePage() {
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [upcoming, setUpcoming] = useState([])
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

  return (
    <section className="homepage">
      <HeroBanner movie={heroMovie} />
      {loading ? <p className="homepage-loading">Loading sections...</p> : null}
      <MovieCarousel title="Trending Movies" movies={trending} />
      <MovieCarousel title="Popular Movies" movies={popular} />
      <MovieCarousel title="Top Rated Movies" movies={topRated} />
      <MovieCarousel title="Upcoming Movies" movies={upcoming} />
    </section>
  )
}

export default HomePage
