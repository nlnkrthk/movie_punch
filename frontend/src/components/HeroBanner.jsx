import { useNavigate } from "react-router-dom"
import "../css/HeroBanner.css"

function HeroBanner({ movie }) {
  const navigate = useNavigate()

  if (!movie) return null

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : ""

  const handleBannerClick = () => {
    navigate(`/movie/${movie.id}`)
  }

  return (
    <section
      className="hero-banner"
      style={backdrop ? { backgroundImage: `linear-gradient(#00000070, #00000099), url(${backdrop})` } : {}}
      onClick={handleBannerClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleBannerClick()
        }
      }}
    >
      <div className="hero-banner-content">
        <h1>{movie.title}</h1>
        <p>{movie.overview || "A featured movie spotlight from today's feed."}</p>
      </div>
    </section>
  )
}

export default HeroBanner
