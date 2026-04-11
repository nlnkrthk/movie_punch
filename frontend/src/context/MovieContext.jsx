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

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/favorites`

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

  // Fetch favorites from backend when token changes (login / logout / switch account)
  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites([])
      return
    }

    let cancelled = false

    async function fetchFavorites() {
      try {
        const res = await axios.get(API_URL, {
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

  const addToFavorites = useCallback(
    async (movie) => {
      if (!movie || movie.id == null || !isLoggedIn) return
      // Optimistic update
      setFavorites((prev) => {
        if (prev.some((f) => String(f.movieId) === String(movie.id))) return prev
        return [...prev, { movieId: movie.id, movieData: movie }]
      })
      try {
        await axios.post(
          API_URL,
          { movieId: movie.id },
          { headers: { Authorization: token } }
        )
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
        await axios.delete(`${API_URL}/${movieId}`, {
          headers: { Authorization: token },
        })
      } catch {
        // Re-fetch on failure to restore correct state
        try {
          const res = await axios.get(API_URL, {
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

  const value = useMemo(
    () => ({
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
    }),
    [favorites, addToFavorites, removeFromFavorites, isFavorite]
  )

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>
}
