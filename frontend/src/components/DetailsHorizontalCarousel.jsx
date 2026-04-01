import { useRef } from "react"
import "../css/DetailsHorizontalCarousel.css"

function DetailsHorizontalCarousel({ title, children }) {
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
    const first = el.querySelector(".details-h-item")
    const width = first ? first.getBoundingClientRect().width : 150
    const gap = 10
    el.scrollBy({ left: direction * (width + gap) * 2, behavior: "smooth" })
  }

  return (
    <section className="details-h-carousel-shell">
      <button
        type="button"
        className="details-h-arrow left"
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
        onMouseDown={() => startHold(-1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
      >
        ←
      </button>

      <div className="details-h-carousel">
        <h2 className="details-h-title">{title}</h2>
        <div className="details-h-viewport">
          <div className="details-h-track" ref={trackRef}>
            {children}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="details-h-arrow right"
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

export default DetailsHorizontalCarousel
