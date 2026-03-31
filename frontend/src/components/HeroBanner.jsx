import "../css/HeroBanner.css"

function HeroBanner({ movie }) {
  if (!movie) return null

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : ""

  return (
    <section
      className="hero-banner"
      style={backdrop ? { backgroundImage: `linear-gradient(#00000070, #00000099), url(${backdrop})` } : {}}
    >
      <div className="hero-banner-content">
        <h1>{movie.title}</h1>
        <p>{movie.overview || "A featured movie spotlight from today's feed."}</p>
        <div className="hero-banner-actions">
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noreferrer"
            className="hero-btn"
          >
            Watch Trailer
          </a>
          <a href="/" className="hero-btn secondary">
            Explore Movies
          </a>
        </div>
      </div>
    </section>
  )
}

export default HeroBanner
