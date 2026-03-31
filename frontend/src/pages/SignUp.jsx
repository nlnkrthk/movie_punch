import "../css/Auth.css";
import { Link } from "react-router-dom";

function SignUp() {
  return (
    <section className="auth-page">
      <div className="auth-card auth-signup neo-texture">
        <h1>Sign Up</h1>
        <p>Create your account and start saving favorites across sessions.</p>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="signup-name">Name</label>
          <input id="signup-name" type="text" placeholder="Movie Fan" required />

          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" placeholder="you@example.com" required />

          <label htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" placeholder="********" required />

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
