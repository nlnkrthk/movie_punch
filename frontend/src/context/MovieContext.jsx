/* eslint-disable react-refresh/only-export-components -- context + hook share one module */
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react"

const STORAGE_KEY = "favorites"

function parseStored() {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return []
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let cachedFavorites = parseStored()

function getSnapshot() {
  return cachedFavorites
}

function getServerSnapshot() {
  return []
}

function subscribe(callback) {
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cachedFavorites = parseStored()
      callback()
    }
  }
  const onLocal = () => callback()
  window.addEventListener("storage", onStorage)
  window.addEventListener("favorites-changed", onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener("favorites-changed", onLocal)
  }
}

function persistFavorites(next) {
  cachedFavorites = next
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedFavorites))
    }
  } catch {
    /* quota / private mode */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("favorites-changed"))
  }
}

function setFavorites(updater) {
  const next = typeof updater === "function" ? updater(cachedFavorites) : updater
  if (next === cachedFavorites) return
  persistFavorites(next)
}

const MovieContext = createContext(null)

export const useMovieContext = () => {
  const ctx = useContext(MovieContext)
  if (!ctx) {
    throw new Error("useMovieContext must be used within MovieProvider")
  }
  return ctx
}

function sameMovieId(a, b) {
  return String(a) === String(b)
}

export const MovieProvider = ({ children }) => {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addToFavorites = useCallback((movie) => {
    if (movie == null || movie.id == null) return
    setFavorites((prev) => {
      if (prev.some((fav) => sameMovieId(fav.id, movie.id))) return prev
      return [...prev, movie]
    })
  }, [])

  const removeFromFavorites = useCallback((movieId) => {
    if (movieId == null) return
    setFavorites((prev) => prev.filter((m) => !sameMovieId(m.id, movieId)))
  }, [])

  const isFavorite = useCallback(
    (movieId) => {
      if (movieId == null) return false
      return favorites.some((m) => sameMovieId(m.id, movieId))
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
