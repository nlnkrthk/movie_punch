/* eslint-disable react-refresh/only-export-components -- context + hook share one module */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react"
import axios from "axios"
import { useAuth } from "./AuthContext"

const API_BASE = import.meta.env.VITE_API_BASE_URL
const FAV_URL = `${API_BASE}/favorites`
const WATCH_URL = `${API_BASE}/watchlist`

const MovieContext = createContext(null)

export const useMovieContext = () => {
  const ctx = useContext(MovieContext)
  if (!ctx) {
    throw new Error("useMovieContext must be used within MovieProvider")
  }
  return ctx
}

export const MovieProvider = ({ children }) => {
  const { token, isLoggedIn } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [watchlist, setWatchlist] = useState([])

  // ── Fetch favorites ──
  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([])
      return
    }

    let cancelled = false

    async function fetchFavorites() {
      try {
        const res = await axios.get(FAV_URL, {
          headers: { Authorization: token },
        })
        if (!cancelled) {
          setFavorites(res.data)
        }
      } catch {
        if (!cancelled) setFavorites([])
      }
    }

    fetchFavorites()
    return () => { cancelled = true }
  }, [token, isLoggedIn])

  // ── Fetch watchlist ──
  useEffect(() => {
    if (!isLoggedIn) {
      setWatchlist([])
      return
    }

    let cancelled = false

    async function fetchWatchlist() {
      try {
        const res = await axios.get(WATCH_URL, {
          headers: { Authorization: token },
        })
        if (!cancelled) {
          setWatchlist(res.data || [])
        }
      } catch {
        if (!cancelled) setWatchlist([])
      }
    }

    fetchWatchlist()
    return () => { cancelled = true }
  }, [token, isLoggedIn])

  // ── Favorites ──
  const addToFavorites = useCallback(
    async (movie) => {
      if (!movie || movie.id == null || !isLoggedIn) return
      // Optimistic update with timestamp for activity sorting
      setFavorites((prev) => {
        if (prev.some((f) => String(f.movieId) === String(movie.id))) return prev
        return [...prev, { movieId: movie.id, movieData: movie, createdAt: new Date().toISOString() }]
      })
      try {
        const res = await axios.post(
          FAV_URL,
          { movieId: movie.id },
          { headers: { Authorization: token } }
        )
        // Replace optimistic entry with server data (has real _id and createdAt)
        if (res.data) {
          setFavorites((prev) =>
            prev.map((f) =>
              String(f.movieId) === String(movie.id) && !f._id ? res.data : f
            )
          )
        }
      } catch {
        // Revert on failure
        setFavorites((prev) => prev.filter((f) => String(f.movieId) !== String(movie.id)))
      }
    },
    [token, isLoggedIn]
  )

  const removeFromFavorites = useCallback(
    async (movieId) => {
      if (movieId == null || !isLoggedIn) return
      // Optimistic update
      setFavorites((prev) => prev.filter((f) => String(f.movieId) !== String(movieId)))
      try {
        await axios.delete(`${FAV_URL}/${movieId}`, {
          headers: { Authorization: token },
        })
      } catch {
        // Re-fetch on failure to restore correct state
        try {
          const res = await axios.get(FAV_URL, {
            headers: { Authorization: token },
          })
          setFavorites(res.data)
        } catch { /* silent */ }
      }
    },
    [token, isLoggedIn]
  )

  const isFavorite = useCallback(
    (movieId) => {
      if (movieId == null) return false
      return favorites.some((f) => String(f.movieId) === String(movieId))
    },
    [favorites]
  )

  // ── Watchlist ──
  const addToWatchlist = useCallback(
    async (movieId) => {
      if (movieId == null || !isLoggedIn) return
      // Optimistic update with timestamp
      setWatchlist((prev) => {
        if (prev.some((w) => String(w.movieId) === String(movieId))) return prev
        return [...prev, { movieId: Number(movieId), createdAt: new Date().toISOString() }]
      })
      try {
        const res = await axios.post(
          WATCH_URL,
          { movieId: Number(movieId) },
          { headers: { Authorization: token } }
        )
        // Replace optimistic entry with server data
        if (res.data) {
          setWatchlist((prev) =>
            prev.map((w) =>
              String(w.movieId) === String(movieId) && !w._id ? res.data : w
            )
          )
        }
      } catch {
        // Revert on failure
        setWatchlist((prev) => prev.filter((w) => String(w.movieId) !== String(movieId)))
      }
    },
    [token, isLoggedIn]
  )

  const removeFromWatchlist = useCallback(
    async (movieId) => {
      if (movieId == null || !isLoggedIn) return
      // Optimistic update
      setWatchlist((prev) => prev.filter((w) => String(w.movieId) !== String(movieId)))
      try {
        await axios.delete(`${WATCH_URL}/${movieId}`, {
          headers: { Authorization: token },
        })
      } catch {
        // Re-fetch on failure
        try {
          const res = await axios.get(WATCH_URL, {
            headers: { Authorization: token },
          })
          setWatchlist(res.data || [])
        } catch { /* silent */ }
      }
    },
    [token, isLoggedIn]
  )

  const isInWatchlist = useCallback(
    (movieId) => {
      if (movieId == null) return false
      return watchlist.some((w) => String(w.movieId) === String(movieId))
    },
    [watchlist]
  )

  const value = useMemo(
    () => ({
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
    }),
    [favorites, addToFavorites, removeFromFavorites, isFavorite,
     watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist]
  )

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
}
