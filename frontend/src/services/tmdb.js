const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

const requestCache = new Map()

function cleanParams(params) {
  const cleaned = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    if (typeof v === "string" && v.trim() === "") continue
    cleaned[k] = v
  }
  return cleaned
}

function toQueryString(params = {}) {
  const query = new URLSearchParams(cleanParams({ api_key: API_KEY, ...params }))
  return query.toString()
}

async function request(path, params = {}) {
  const key = `${path}?${toQueryString(params)}`
  if (requestCache.has(key)) return requestCache.get(key)

  const promise = fetch(`${BASE_URL}${path}?${toQueryString(params)}`).then(async (res) => {
    if (!res.ok) {
      throw new Error(`TMDB request failed: ${res.status}`)
    }
    return res.json()
  })

  requestCache.set(key, promise)
  try {
    return await promise
  } catch (error) {
    requestCache.delete(key)
    throw error
  }
}

export const getPopularMovies = (page = 1, sortBy = "popularity.desc") =>
  request("/movie/popular", { page, sort_by: sortBy })

export const searchMovies = (query, page = 1, sortBy = "popularity.desc") =>
  request("/search/movie", { query, page, sort_by: sortBy, include_adult: false })

export const searchPerson = (query, page = 1) =>
  request("/search/person", { query, page, include_adult: false })

export const discoverMovies = ({ page = 1, genreId = "", personId = "", sortBy = "popularity.desc", lteDate = "" }) =>
  request("/discover/movie", {
    page,
    with_genres: genreId || undefined,
    with_people: personId || undefined,
    sort_by: sortBy,
    include_adult: false,
    "primary_release_date.lte": lteDate || undefined,
  })

export const getGenres = () => request("/genre/movie/list")

export const getTrendingMovies = () => request("/trending/movie/day")
export const getTopRatedMovies = () => request("/movie/top_rated")
export const getUpcomingMovies = () => request("/movie/upcoming")

export const getMovieDetails = (movieId) =>
  request(`/movie/${movieId}`, { append_to_response: "credits,videos" })

export const getSimilarMovies = (movieId, page = 1) =>
  request(`/movie/${movieId}/similar`, { page })

export const getWatchProviders = (movieId) =>
  request(`/movie/${movieId}/watch/providers`)
