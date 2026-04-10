import "../css/Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
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
      [e.target.id.replace("signup-", "")]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsShaking(false);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        formData
      );

      navigate("/signin");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid credentials");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <section className="auth-page">
      <div className={`auth-card auth-signup ${errorMsg ? "error" : ""} ${isShaking ? "shake" : ""}`}>
        <span className="auth-badge">Let's Go!</span>

        <div className="auth-heading-wrap">
          <h1>
            Sign{" "}
            <span className="auth-heading-accent">Up</span>
          </h1>
        </div>
        <p>Create your account and start saving favorites.</p>

        {errorMsg && (
          <div className="auth-error-badge">
            {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Movie Fan"
              required
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              required
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="password-field">
              <input
                id="signup-password"
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

          <button type="submit">Create Account</button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default SignUp;