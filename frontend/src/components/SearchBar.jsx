import "../css/SearchBar.css"

function SearchBar({ value, onChange, searchMode = 'title', onSearchModeChange }) {
  return (
    <div className="searchbar-wrap">
      <div className="searchbar-header">
        <label htmlFor="movie-search" className="searchbar-label">
          Search
        </label>
        {onSearchModeChange && (
          <div className="searchbar-mode-toggle">
            <button 
              type="button" 
              className={`mode-btn ${searchMode === 'title' ? 'active' : ''}`}
              onClick={() => onSearchModeChange('title')}
            >
              Title
            </button>
            <button 
              type="button" 
              className={`mode-btn ${searchMode === 'person' ? 'active' : ''}`}
              onClick={() => onSearchModeChange('person')}
            >
              Person
            </button>
          </div>
        )}
      </div>
      <input
        id="movie-search"
        type="search"
        className="searchbar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={searchMode === 'title' ? "Search for a movie title..." : "Search for a director or actor..."}
      />
    </div>
  )
}

export default SearchBar
