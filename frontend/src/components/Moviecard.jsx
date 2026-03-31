import "../css/MovieCard.css"
import { useMovieContext } from "../context/MovieContext";

function MovieCard({ movie }) {
    const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext();
    const favorited = isFavorite(movie.id);
    
    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : 'https://via.placeholder.com/200x300?text=No+Image';
    
    const releaseYear = movie.release_date 
        ? new Date(movie.release_date).getFullYear() 
        : 'N/A';
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const overview = movie.overview || 'No description available';

    function onFavoriteClick(e) {
        e.preventDefault();
        e.stopPropagation();
        if (favorited) {
            removeFromFavorites(movie.id);
        } else {
            addToFavorites(movie);
        }
    }
    
    return (
        <div className="movie-card">
            <img src={posterUrl} alt={movie.title} className="movie-poster" />
            <div className="movie-info">
                <h3 className="movie-title">{movie.title || 'Unknown Title'}</h3>
                <p className="movie-year">{releaseYear}</p>
                <p className="movie-rating">★ {rating}</p>
                <p className="movie-description">{overview}</p>
            </div>
            <div className="movie-overlay">
                <button type="button" className={`favorite-button ${favorited ? "active" : ""}`} onClick={onFavoriteClick} style={{ color: favorited ? 'red' : 'white' }}>
                    {favorited ? '♥' : '♡'}
                </button>
            </div>
        </div>
    );
}

export default MovieCard;