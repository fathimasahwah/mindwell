import { useState } from 'react';
import { api } from '../api.js';

export const EMOTIONS = [
  'happy', 'calm', 'grateful', 'excited', 'tired',
  'anxious', 'sad', 'angry', 'stressed', 'lonely',
];

const FACES = ['😞', '😞', '😔', '😕', '😐', '🙂', '🙂', '😊', '😄', '🤩'];
const BOLTS = ['🪫', '🪫', '😴', '😴', '😶', '🙂', '🙂', '⚡', '⚡', '🔥'];

export default function MoodLogger({ onLogged }) {
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [emotions, setEmotions] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (e) =>
    setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : cur.length < 5 ? [...cur, e] : cur));

  const submit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/mood', { mood, energy, emotions, note });
      setEmotions([]);
      setNote('');
      onLogged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>How are you feeling?</h2>

      <label className="slider">
        <span>
          Mood <strong>{mood}/10</strong> <span className="face" aria-hidden="true">{FACES[mood - 1]}</span>
        </span>
        <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(+e.target.value)} />
      </label>

      <label className="slider">
        <span>
          Energy <strong>{energy}/10</strong> <span className="face" aria-hidden="true">{BOLTS[energy - 1]}</span>
        </span>
        <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(+e.target.value)} />
      </label>

      <fieldset className="chips">
        <legend>Emotions (up to 5)</legend>
        {EMOTIONS.map((e) => (
          <button
            type="button"
            key={e}
            className={`chip ${emotions.includes(e) ? 'on' : ''}`}
            aria-pressed={emotions.includes(e)}
            onClick={() => toggle(e)}
          >
            {e}
          </button>
        ))}
      </fieldset>

      <label className="field">
        <span>Private note (encrypted)</span>
        <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Log mood'}</button>
    </form>
  );
}
