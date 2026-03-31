import MovieCard from "./MovieCard"
import "../css/MovieCarousel.css"
import { useRef } from "react"

function MovieCarousel({ title, movies }) {
  const trackRef = useRef(null)
  const holdRafRef = useRef(0)
  const holdDirRef = useRef(0)

  const stopHold = () => {
    cancelAnimationFrame(holdRafRef.current)
    holdDirRef.current = 0
  }

  const startHold = (direction) => {
    const el = trackRef.current
    if (!el) return
    stopHold()
    holdDirRef.current = direction
    const step = () => {
      el.scrollLeft += holdDirRef.current * 3
      holdRafRef.current = requestAnimationFrame(step)
    }
    holdRafRef.current = requestAnimationFrame(step)
  }

  const nudge = (direction) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector(".movie-card")
    const width = card ? card.getBoundingClientRect().width : 220
    const gap = 13
    el.scrollBy({ left: direction * (width + gap) * 3, behavior: "smooth" })
  }

  return (
    <section className="movie-carousel-shell">
      <button
        type="button"
        className="carousel-arrow left"
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        onMouseDown={() => startHold(-1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
      >
        ←
      </button>

      <div className="movie-carousel">
        <h2 className="movie-carousel-title">{title}</h2>

        <div className="movie-carousel-viewport">
        <button
          type="button"
          className="carousel-arrow-inner left"
          aria-label="Scroll left"
          onClick={() => nudge(-1)}
          onMouseDown={() => startHold(-1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
        >
          ←
        </button>

          <div className="movie-carousel-track" ref={trackRef}>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

        <button
          type="button"
          className="carousel-arrow-inner right"
          aria-label="Scroll right"
          onClick={() => nudge(1)}
          onMouseDown={() => startHold(1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
        >
          →
        </button>
        </div>
      </div>

      <button
        type="button"
        className="carousel-arrow right"
        aria-label="Scroll right"
        onClick={() => nudge(1)}
        onMouseDown={() => startHold(1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
      >
        →
      </button>
    </section>
  )
}

export default MovieCarousel
