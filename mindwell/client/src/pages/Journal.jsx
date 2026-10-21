import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const PAGE_SIZE = 8;
const fmt = (d) =>
  new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function Journal() {
  const [prompt, setPrompt] = useState('');
  const [form, setForm] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [limited, setLimited] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounce = useRef();

  const load = useCallback(async (query, pageNum, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: PAGE_SIZE });
      if (query) params.set('q', query);
      const data = await api.get(`/journal?${params}`);
      setEntries((cur) => (append ? [...cur, ...data.entries] : data.entries));
      setTotal(data.total);
      setLimited(data.limited);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/journal/prompt/today').then((d) => setPrompt(d.prompt)).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(q.trim(), 1), 300);
    return () => clearTimeout(debounce.current);
  }, [q, load]);

  const shuffle = async () => {
    const d = await api.get(`/journal/prompt/today?shuffle=1&current=${encodeURIComponent(prompt)}`);
    setPrompt(d.prompt);
  };

  const reset = () => {
    setForm({ title: '', content: '' });
    setEditingId(null);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await api.put(`/journal/${editingId}`, form);
      else await api.post('/journal', { ...form, prompt });
      reset();
      await load(q.trim(), 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (entry) => {
    setEditingId(entry.id);
    setForm({ title: entry.title === 'Untitled' ? '' : entry.title, content: entry.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this entry permanently?')) return;
    try {
      await api.del(`/journal/${id}`);
      if (editingId === id) reset();
      await load(q.trim(), 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page two-col">
      <section>
        <form className="card" onSubmit={save}>
          <h2>{editingId ? 'Edit entry' : 'New entry'}</h2>

          {!editingId && prompt && (
            <div className="prompt">
              <p>
                <span aria-hidden="true">💭</span> {prompt}
              </p>
              <button type="button" className="btn ghost small" onClick={shuffle}>Another prompt</button>
            </div>
          )}

          <label className="field">
            <span>Title</span>
            <input
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="field">
            <span>Your thoughts</span>
            <textarea
              required
              rows={10}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="This space is only yours…"
            />
          </label>

          <p className="notice">🔐 Encrypted with AES-256 before it is saved.</p>
          {error && <p className="error" role="alert">{error}</p>}

          <div className="row">
            <button className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update entry' : 'Save entry'}
            </button>
            {editingId && (
              <button type="button" className="btn ghost" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="card">
          <h2>Your entries</h2>
          <input
            className="search"
            type="search"
            placeholder="Search your entries…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search entries"
          />
          {q && limited && (
            <p className="notice">
              Searching the last 30 days. <Link to="/settings">Upgrade</Link> for unlimited history search.
            </p>
          )}

          {!loading && entries.length === 0 && (
            <p className="muted">{q ? 'No entries match your search.' : 'No entries yet. Write your first one.'}</p>
          )}

          <ul className="entries">
            {entries.map((en) => (
              <li key={en.id} className="entry">
                <div className="entry-head">
                  <h3>{en.title}</h3>
                  <time className="muted">{fmt(en.createdAt)}</time>
                </div>
                {en.prompt && <p className="muted small-text">💭 {en.prompt}</p>}
                <p className="entry-body">{en.content}</p>
                <div className="row">
                  <button className="btn ghost small" onClick={() => edit(en)}>Edit</button>
                  <button className="btn ghost small danger" onClick={() => remove(en.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          {entries.length < total && (
            <button className="btn ghost" disabled={loading} onClick={() => load(q.trim(), page + 1, true)}>
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
