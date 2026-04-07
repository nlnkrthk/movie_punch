import "../css/Favorites.css"
import { useMovieContext } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { getMovieDetails } from "../services/tmdb"
import MovieCard from "../components/MovieCard"

function Favorites() {
  const { favorites } = useMovieContext()
  const { isLoggedIn } = useAuth()
  const [movies, setMovies] = useState([])

  useEffect(() => {
    if (!isLoggedIn || favorites.length === 0) {
      setMovies([])
      return
    }

    let cancelled = false

    async function fetchAll() {
      try {
        const results = await Promise.all(
          favorites.map((fav) => getMovieDetails(fav.movieId))
        )
        if (!cancelled) setMovies(results)
      } catch {
        if (!cancelled) setMovies([])
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [favorites, isLoggedIn])

  if (movies.length > 0) {
    return (
      <div className="favorites">
        <header className="favorites-header">
          <h2>Your Favorites</h2>
          <p>{movies.length} movie stickers saved</p>
        </header>
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="favorites-empty neo-texture">
      <h2>No Favorite Movies Yet</h2>
      <p>Hit the heart on any card and build your loud little watchlist.</p>
    </section>
  )
}

export default Favorites