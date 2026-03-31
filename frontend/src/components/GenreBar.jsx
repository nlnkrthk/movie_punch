import "../css/GenreBar.css"
import { useMemo, useRef } from "react"

function GenreBar({ genres, selectedGenre, onSelect }) {
  const scrollerRef = useRef(null)
  const rafRef = useRef(0)

  const startAutoScroll = useMemo(() => {
    return (direction) => {
      const el = scrollerRef.current
      if (!el) return
      cancelAnimationFrame(rafRef.current)
      const step = () => {
        el.scrollLeft += direction * 6
        rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    }
  }, [])

  const stopAutoScroll = () => {
    cancelAnimationFrame(rafRef.current)
  }

  return (
    <div className="genrebar-shell" role="tablist" aria-label="Movie genres">
      <div
        className="genrebar-edge left"
        onMouseEnter={() => startAutoScroll(-1)}
        onMouseLeave={stopAutoScroll}
        aria-hidden="true"
      />
      <div
        className="genrebar-edge right"
        onMouseEnter={() => startAutoScroll(1)}
        onMouseLeave={stopAutoScroll}
        aria-hidden="true"
      />

      <div
        className="genrebar-wrap"
        ref={scrollerRef}
        onMouseLeave={stopAutoScroll}
      >
      <button
        type="button"
        className={`genre-pill ${selectedGenre === "" ? "active" : ""}`}
        onClick={() => onSelect("")}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          type="button"
          key={genre.id}
          className={`genre-pill ${String(selectedGenre) === String(genre.id) ? "active" : ""}`}
          onClick={() => onSelect(String(genre.id))}
        >
          {genre.name}
        </button>
      ))}
      </div>
    </div>
  )
}

export default GenreBar
