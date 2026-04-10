import { Link, NavLink, useLocation } from "react-router-dom";
import '../css/NavBar.css'
import Shuffle from './Shuffle';

function NavBar() {
  const { pathname } = useLocation();
  const accountActive = pathname === "/signin" || pathname === "/signup";

  const navClassName = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="navbar">
      <div className="navbar-logo sticker-left">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <Shuffle
            text="Movie Punch"
            shuffleDirection="right"
            duration={0.7}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.04}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop={false}
            loopDelay={0}
          />
        </Link>
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