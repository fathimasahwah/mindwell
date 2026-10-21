import { Link } from 'react-router-dom';

export default function PremiumLock({ children = 'This is a premium feature.' }) {
  return (
    <div className="lock">
      <span aria-hidden="true">🔒</span>
      <p>{children}</p>
      <Link className="btn primary small" to="/settings">Unlock Premium</Link>
    </div>
  );
}
