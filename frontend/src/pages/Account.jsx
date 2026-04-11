import "../css/Auth.css"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import axios from "axios"

function Account() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoggedIn, login, logout } = useAuth()

  const mode = location.pathname === "/signup" ? "signup" : "signin"
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [isShaking, setIsShaking] = useState(false)
  const [profilePic] = useState(() => {
    try {
      const stored = localStorage.getItem(`pfp_${user?.id}`)
      return stored || null
    } catch {
      return null
    }
  })

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
    if (errorMsg) setErrorMsg("")
    navigate(nextMode === "signup" ? "/signup" : "/signin")
  }

  function handleSignInChange(e) {
    if (errorMsg) setErrorMsg("")
    setSignInData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  function handleSignUpChange(e) {
    if (errorMsg) setErrorMsg("")
    setSignUpData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSignInSubmit(e) {
    e.preventDefault()
    setErrorMsg("")
    setIsShaking(false)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, signInData)
      login(res.data.token, res.data.user)
      navigate("/")
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid credentials")
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  async function handleSignUpSubmit(e) {
    e.preventDefault()
    setErrorMsg("")
    setIsShaking(false)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, signUpData)
      switchMode("signin")
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Registration failed")
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
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

    return (
      <section className="auth-page">
        <div className="profile-card">
          <span className="auth-badge">Your Profile</span>

          <div className="profile-avatar-wrap" aria-hidden="true">
            <div className="profile-avatar">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="profile-avatar-img" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>

          <h1 className="profile-name">{user?.name || "User"}</h1>
          <p className="profile-email">{user?.email || ""}</p>

          <div className="profile-stats">
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
      <div className={`auth-card ${mode === "signup" ? "auth-signup" : ""} ${errorMsg ? "error" : ""} ${isShaking ? "shake" : ""}`}>
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

        {errorMsg && (
          <div className="auth-error-badge">
            {errorMsg}
          </div>
        )}

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
