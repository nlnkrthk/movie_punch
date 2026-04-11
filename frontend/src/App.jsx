import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import './css/App.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const MySpacePage = lazy(() => import('./pages/MySpacePage'))
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'))
const Account = lazy(() => import('./pages/Account'))

function App() {
  return (
    <div className="app-shell neo-grid">
      <NavBar />
      <main className="app-main">
        <Suspense fallback={<div className="loading-fallback neo-texture">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/movie/:movieId" element={<MovieDetailsPage />} />
            <Route path="/my-space" element={<MySpacePage />} />
            <Route path="/favorites" element={<MySpacePage />} />
            <Route path="/signin" element={<Account />} />
            <Route path="/signup" element={<Account />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}



export default App
