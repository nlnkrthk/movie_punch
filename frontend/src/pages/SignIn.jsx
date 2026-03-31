import "../css/Auth.css";
import { Link } from "react-router-dom";

function SignIn() {
  return (
    <section className="auth-page">
      <div className="auth-card neo-texture">
        <h1>Sign In</h1>
        <p>Welcome back. Pick up your movie watchlist where you left off.</p>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="signin-email">Email</label>
          <input id="signin-email" type="email" placeholder="you@example.com" required />

          <label htmlFor="signin-password">Password</label>
          <input id="signin-password" type="password" placeholder="********" required />

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
