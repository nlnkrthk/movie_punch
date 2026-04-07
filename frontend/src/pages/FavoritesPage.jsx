import { useMovieContext } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getMovieDetails } from "../services/tmdb"
import MovieListItem from "../components/MovieListItem"
import "../css/FavoritesPage.css"

function FavoritesPage() {
  const { favorites } = useMovieContext()
  const { isLoggedIn } = useAuth()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch full movie details from TMDB for each favorite
  useEffect(() => {
    if (!isLoggedIn || favorites.length === 0) {
      setMovies([])
      return
    }

    let cancelled = false
    setLoading(true)

    async function fetchAll() {
      try {
        const results = await Promise.all(
          favorites.map((fav) => getMovieDetails(fav.movieId))
        )
        if (!cancelled) setMovies(results)
      } catch {
        if (!cancelled) setMovies([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [favorites, isLoggedIn])

  if (!isLoggedIn) {
    return (
      <section className="favorites-page-empty neo-texture">
        <h2>Sign In to See Favorites</h2>
        <p>
          <Link to="/signin">Sign in</Link> to save and view your favorite movies.
        </p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="favorites-page-empty neo-texture">
        <h2>Loading...</h2>
      </section>
    )
  }

  if (movies.length === 0) {
    return (
      <section className="favorites-page-empty neo-texture">
        <h2>No Favorite Movies Yet</h2>
        <p>Tap the favorite button while exploring to save titles here.</p>
      </section>
    )
  }

  return (
    <section className="favorites-page">
      <h2>Your Favorites</h2>
      <div className="favorites-page-list">
        {movies.map((movie) => (
          <MovieListItem key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}

export default FavoritesPage
