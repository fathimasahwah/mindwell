import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="brand">🌿 MindWell</span>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>Journal</NavLink>
          <NavLink to="/mood">Mood</NavLink>
          <NavLink to="/breathe">Breathe</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="nav-actions">
          {user.isPremium && <span className="badge">Premium</span>}
          <button
            className="btn ghost icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title="Toggle dark mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
