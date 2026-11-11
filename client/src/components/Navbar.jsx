import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Habit Planner
        </Link>
        <div className="nav-links">
          {token ? (
            <>
              <Link to="/" className="nav-link">Planner</Link>
              <Link to="/habits" className="nav-link">Habits</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <span className="nav-user">{user?.name}</span>
              <button onClick={handleLogout} className="btn-logout" type="button">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-link btn-signup-link">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
