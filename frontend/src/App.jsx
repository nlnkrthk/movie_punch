import './css/App.css'
import ExplorePage from './pages/ExplorePage'
import HomePage from './pages/HomePage'
import FavoritesPage from './pages/FavoritesPage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'

function App() {

  return (
    <div className="app-shell neo-grid">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/movie/:movieId" element={<MovieDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
    </div>
  )
}



export default App
