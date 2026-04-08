import { Link, NavLink, useLocation } from "react-router-dom";
import '../css/NavBar.css'
function NavBar() {
  const { pathname } = useLocation();
  const accountActive = pathname === "/signin" || pathname === "/signup";

  const navClassName = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="navbar">
      <div className="navbar-logo sticker-left">
        <Link to="/">Movie Punch</Link>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end className={navClassName}>Home</NavLink>
        <NavLink to="/explore" className={navClassName}>Explore</NavLink>
        <NavLink to="/my-space" className={navClassName}>My Space</NavLink>
        <NavLink to="/signin" className={`nav-link${accountActive ? " active" : ""}`}>
          Account
        </NavLink>
      </div>
    </nav>
  );
}


export default NavBar