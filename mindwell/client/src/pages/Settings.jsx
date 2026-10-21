import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const stamp = () => new Date().toISOString().slice(0, 10);

export default function Settings() {
  const { user, setPremium, logout } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changePlan = (upgrade) =>
    run(async () => {
      const d = await api.post(upgrade ? '/billing/upgrade' : '/billing/downgrade');
      setPremium(d.isPremium);
      setMsg(d.isPremium ? 'Premium unlocked. Thank you!' : 'You are back on the free plan.');
    });

  const download = (format) =>
    run(async () => {
      await api.download(`/export?format=${format}`, `mindwell-export-${stamp()}.${format}`);
      setMsg(`Your ${format.toUpperCase()} export has been downloaded.`);
    });

  const deleteAccount = () =>
    run(async () => {
      const password = window.prompt('This permanently deletes your account and all entries. Enter your password to confirm:');
      if (!password) return;
      await api.del('/account', { password });
      logout();
      navigate('/register');
    });

  return (
    <main className="page narrow">
      <div className="card">
        <h2>Account</h2>
        <p>{user.name}</p>
        <p className="muted">{user.email}</p>
      </div>

      <div className="card">
        <h2>Plan</h2>
        <div className="plans">
          <div className={`plan ${!user.isPremium ? 'current' : ''}`}>
            <h3>Free</h3>
            <ul>
              <li>Encrypted journaling with daily prompts</li>
              <li>Mood and energy logging</li>
              <li>7-day mood chart</li>
              <li>Search the last 30 days</li>
              <li>Breathing assistant, dark mode, data export</li>
            </ul>
          </div>
          <div className={`plan ${user.isPremium ? 'current' : ''}`}>
            <h3>Premium</h3>
            <ul>
              <li>Everything in Free</li>
              <li>Weekly and monthly mood analytics</li>
              <li>Most common emotions chart</li>
              <li>Up to a year of mood history</li>
              <li>Unlimited historical search</li>
            </ul>
          </div>
        </div>
        {user.isPremium ? (
          <button className="btn ghost" disabled={busy} onClick={() => changePlan(false)}>Switch to Free</button>
        ) : (
          <button className="btn primary" disabled={busy} onClick={() => changePlan(true)}>Upgrade to Premium</button>
        )}
        <p className="muted small-text">Demo billing: no payment is taken. Connect Stripe to charge for real.</p>
      </div>

      <div className="card">
        <h2>Your data</h2>
        <p className="muted">Your data belongs to you. Download everything, decrypted, whenever you like.</p>
        <div className="row">
          <button className="btn ghost" disabled={busy} onClick={() => download('json')}>Export JSON</button>
          <button className="btn ghost" disabled={busy} onClick={() => download('pdf')}>Export PDF</button>
        </div>
      </div>

      <div className="card">
        <h2>Danger zone</h2>
        <button className="btn ghost danger" disabled={busy} onClick={deleteAccount}>Delete my account</button>
      </div>

      {msg && <p className="notice" role="status">{msg}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
