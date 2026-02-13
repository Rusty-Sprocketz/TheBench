import { Link, useLocation } from 'react-router-dom'
import './Nav.css'

function Nav() {
  const location = useLocation()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">///</span>
          <span className="nav-logo-text">The Bench</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/interview"
            className={`nav-link ${location.pathname === '/interview' ? 'active' : ''}`}
          >
            Interview
          </Link>
          <Link
            to="/agentops"
            className={`nav-link ${location.pathname === '/agentops' ? 'active' : ''}`}
          >
            AgenticOps
          </Link>
          <Link
            to="/how-it-works"
            className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}
          >
            How It Works
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Nav
