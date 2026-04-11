import "../css/Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleChange = (e) => {
    if (errorMsg) setErrorMsg("");
    setFormData({
      ...formData,
      [e.target.id.replace("signin-", "")]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsShaking(false);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        formData
      );
      
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid credentials");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <section className="auth-page">
      <div className={`auth-card ${errorMsg ? "error" : ""} ${isShaking ? "shake" : ""}`}>
        <span className="auth-badge">Welcome Back</span>

        <div className="auth-heading-wrap">
          <h1>
            Sign{" "}
            <span className="auth-heading-accent">In</span>
          </h1>
        </div>

        {errorMsg && (
          <div className="auth-error-badge">
            {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              required
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signin-password">Password</label>
            <div className="password-field">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit">Sign In</button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default SignIn;