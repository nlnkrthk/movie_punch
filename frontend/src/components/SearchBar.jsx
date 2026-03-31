import "../css/SearchBar.css"

function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar-wrap">
      <label htmlFor="movie-search" className="searchbar-label">
        Search movies
      </label>
      <input
        id="movie-search"
        type="search"
        className="searchbar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search title, keyword, cast..."
      />
    </div>
  )
}

export default SearchBar
