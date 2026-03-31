import "../css/Favorites.css";
import { useMovieContext } from "../context/MovieContext";
import MovieCard from "../components/MovieCard";

function Favorites() {
  const { favorites } = useMovieContext();

  if (favorites.length > 0) {
    return (
      <div className="favorites">
        <header className="favorites-header">
          <h2>Your Favorites</h2>
          <p>{favorites.length} movie stickers saved</p>
        </header>
        <div className="movies-grid">
          {favorites.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="favorites-empty neo-texture">
      <h2>No Favorite Movies Yet</h2>
      <p>Hit the heart on any card and build your loud little watchlist.</p>
    </section>
  );
}

export default Favorites;