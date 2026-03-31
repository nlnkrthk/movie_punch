import { useMovieContext } from "../context/MovieContext"
import MovieListItem from "../components/MovieListItem"
import "../css/FavoritesPage.css"

function FavoritesPage() {
  const { favorites } = useMovieContext()

  if (favorites.length === 0) {
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
        {favorites.map((movie) => (
          <MovieListItem key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}

export default FavoritesPage
