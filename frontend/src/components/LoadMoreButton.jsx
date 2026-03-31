import "../css/LoadMoreButton.css"

function LoadMoreButton({ onClick, disabled, loading }) {
  return (
    <button type="button" className="load-more-button" onClick={onClick} disabled={disabled || loading}>
      {loading ? "Loading..." : "Load More"}
    </button>
  )
}

export default LoadMoreButton
