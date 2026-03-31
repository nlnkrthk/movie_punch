import "../css/SortPanel.css"

function SortPanel({ sortOption, sortOrder, onSortOptionChange, onSortOrderChange, mobile = false }) {
  return (
    <aside className={`sort-panel ${mobile ? "mobile" : ""}`}>
      <h2>Sort by</h2>
      <label>
        Metric
        <select value={sortOption} onChange={(e) => onSortOptionChange(e.target.value)}>
          <option value="popularity">Popularity</option>
          <option value="release_date">Release Date</option>
          <option value="vote_average">Vote Average</option>
          <option value="vote_count">Vote Count</option>
          <option value="title">Title</option>
          <option value="runtime">Runtime</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </label>

      <label>
        Order
        <select value={sortOrder} onChange={(e) => onSortOrderChange(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
    </aside>
  )
}

export default SortPanel
