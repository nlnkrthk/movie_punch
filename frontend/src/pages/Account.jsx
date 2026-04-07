import "../css/Auth.css"
import { useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useMovieContext } from "../context/MovieContext"
import axios from "axios"

function Account() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoggedIn, login, logout } = useAuth()
  const { favorites } = useMovieContext()

  const [profilePic, setProfilePic] = useState(() => {
    try {
      const stored = localStorage.getItem(`pfp_${user?.id}`)
      return stored || null
    } catch {
      return null
    }
  })

  const mode = location.pathname === "/signup" ? "signup" : "signin"
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  })

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
  })

  function switchMode(nextMode) {
    navigate(nextMode === "signup" ? "/signup" : "/signin")
  }

  function handleSignInChange(e) {
    setSignInData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  function handleSignUpChange(e) {
    setSignUpData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSignInSubmit(e) {
    e.preventDefault()
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", signInData)
      login(res.data.token, res.data.user)
      navigate("/")
    } catch (error) {
      alert(error.response?.data?.message || "Error")
    }
  }

  async function handleSignUpSubmit(e) {
    e.preventDefault()
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", signUpData)
      alert(res.data.message)
      switchMode("signin")
    } catch (error) {
      alert(error.response?.data?.message || "Error")
    }
  }

  function handleLogout() {
    logout()
    navigate("/signin")
  }

  // ─── PROFILE VIEW ───
  if (isLoggedIn) {
    const initials = user?.name
      ? user.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?"

    function handleAvatarClick() {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
          alert("Image must be under 2 MB")
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result
          setProfilePic(dataUrl)
          try {
            localStorage.setItem(`pfp_${user.id}`, dataUrl)
          } catch {
            /* quota exceeded */
          }
        }
        reader.readAsDataURL(file)
      }
      input.click()
    }

    function handleRemoveAvatar(e) {
      e.stopPropagation()
      setProfilePic(null)
      localStorage.removeItem(`pfp_${user.id}`)
    }

    return (
      <section className="auth-page">
        <div className="profile-card">
          <span className="auth-badge">Your Profile</span>


          <div
            className="profile-avatar-wrap"
            onClick={handleAvatarClick}
            role="button"
            tabIndex={0}
            aria-label="Change profile picture"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleAvatarClick()
            }}
          >
            <div className="profile-avatar">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="profile-avatar-img" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="profile-avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          {profilePic && (
            <button
              type="button"
              className="profile-remove-pic"
              onClick={handleRemoveAvatar}
            >
              Remove Photo
            </button>
          )}

          <h1 className="profile-name">{user?.name || "User"}</h1>
          <p className="profile-email">{user?.email || ""}</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{favorites.length}</span>
              <span className="profile-stat-label">Favorites</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">Active</span>
              <span className="profile-stat-label">Status</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">2025</span>
              <span className="profile-stat-label">Joined</span>
            </div>
          </div>

          <button
            type="button"
            className="profile-logout"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </section>
    )
  }

  // ─── AUTH FORM VIEW ───
  return (
    <section className="auth-page">
      <div className={`auth-card ${mode === "signup" ? "auth-signup" : ""}`}>
        <span className="auth-badge">
          {mode === "signin" ? "Welcome Back" : "Let's Go!"}
        </span>

        <div className="auth-toggle" role="tablist" aria-label="Account forms">
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "signin" ? "active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {mode === "signin" ? (
          <>
            <div className="auth-heading-wrap">
              <h1>
                Sign{" "}
                <span className="auth-heading-accent">In</span>
              </h1>
            </div>

            <form className="auth-form" onSubmit={handleSignInSubmit}>
              <div className="auth-field">
                <label htmlFor="signin-email">Email</label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={signInData.email}
                  onChange={handleSignInChange}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signin-password">Password</label>
                <div className="password-field">
                  <input
                    id="signin-password"
                    name="password"
                    type={showSignInPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={signInData.password}
                    onChange={handleSignInChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  >
                    {showSignInPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit">Sign In</button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-heading-wrap">
              <h1>
                Sign{" "}
                <span className="auth-heading-accent">Up</span>
              </h1>
            </div>
            <p>Create your account and start saving favorites.</p>

            <form className="auth-form" onSubmit={handleSignUpSubmit}>
              <div className="auth-field">
                <label htmlFor="signup-name">Name</label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Movie Fan"
                  required
                  value={signUpData.name}
                  onChange={handleSignUpChange}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={signUpData.email}
                  onChange={handleSignUpChange}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <div className="password-field">
                  <input
                    id="signup-password"
                    name="password"
                    type={showSignUpPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={signUpData.password}
                    onChange={handleSignUpChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                    aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                  >
                    {showSignUpPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit">Create Account</button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}

export default Account
