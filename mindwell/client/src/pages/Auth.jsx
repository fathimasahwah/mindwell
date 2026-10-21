import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <button className="btn ghost icon theme-corner" onClick={toggle} aria-label="Toggle dark mode">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <form className="card auth-card" onSubmit={submit}>
        <h1>🌿 MindWell</h1>
        <p className="muted">
          {isRegister
            ? 'A private place to reflect. Your entries are encrypted before they are saved.'
            : 'Welcome back. Take a breath.'}
        </p>

        {isRegister && (
          <label className="field">
            <span>Name</span>
            <input required value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>

        {isRegister && (
          <p className="notice">
            Your password also protects your encryption key. If you forget it, your entries cannot be
            recovered.
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
        <p className="muted center">
          {isRegister ? (
            <>Already have an account? <Link to="/login">Sign in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </form>
    </main>
  );
}
