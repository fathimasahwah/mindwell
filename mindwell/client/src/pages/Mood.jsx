import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import MoodLogger from '../components/MoodLogger.jsx';
import PremiumLock from '../components/PremiumLock.jsx';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RANGES = [
  { label: '7 days', range: 7, group: 'day', free: true },
  { label: '30 days', range: 30, group: 'day' },
  { label: '12 weeks', range: 84, group: 'week' },
  { label: '12 months', range: 365, group: 'month' },
];

const PIE_COLORS = [
  '#5b9a8b', '#8fb8de', '#e5b87b', '#c58fb4', '#9bc08a',
  '#e08e8e', '#8d93d6', '#d3a05f', '#7ac7c7', '#b3a58f',
];

export default function Mood() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sel, setSel] = useState(RANGES[0]);
  const [points, setPoints] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  const text = theme === 'dark' ? '#b8cbc6' : '#4a5f5b';
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  const load = useCallback(async () => {
    setError('');
    try {
      const [a, r] = await Promise.all([
        api.get(`/mood/analytics?range=${sel.range}&group=${sel.group}`),
        api.get('/mood/recent'),
      ]);
      setPoints(a.points);
      setRecent(r.logs);
      if (user.isPremium) {
        const e = await api.get(`/mood/emotions?range=${sel.range}`);
        setEmotions(e.emotions);
      } else {
        setEmotions([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [sel, user.isPremium]);

  useEffect(() => {
    load();
  }, [load]);

  const removeLog = async (id) => {
    await api.del(`/mood/${id}`);
    load();
  };

  const lineData = useMemo(
    () => ({
      labels: points.map((p) => p.label),
      datasets: [
        {
          label: 'Mood',
          data: points.map((p) => p.avgMood),
          borderColor: '#5b9a8b',
          backgroundColor: 'rgba(91,154,139,0.18)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Energy',
          data: points.map((p) => p.avgEnergy),
          borderColor: '#e5b87b',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.35,
        },
      ],
    }),
    [points]
  );

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 1, max: 10, ticks: { color: text, stepSize: 1 }, grid: { color: grid } },
      x: { ticks: { color: text, maxRotation: 0, autoSkip: true }, grid: { display: false } },
    },
    plugins: { legend: { labels: { color: text } } },
  };

  const pieData = {
    labels: emotions.map((e) => e.emotion),
    datasets: [
      {
        data: emotions.map((e) => e.count),
        backgroundColor: PIE_COLORS,
        borderColor: theme === 'dark' ? '#17221f' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  return (
    <main className="page">
      <div className="two-col">
        <MoodLogger onLogged={load} />

        <div className="card">
          <h2>Recent logs</h2>
          {recent.length === 0 && <p className="muted">Nothing logged yet.</p>}
          <ul className="logs">
            {recent.map((l) => (
              <li key={l.id}>
                <div>
                  <strong>Mood {l.mood}</strong> · Energy {l.energy}
                  <span className="muted small-text"> · {new Date(l.date).toLocaleDateString()}</span>
                  {l.emotions.length > 0 && <div className="muted small-text">{l.emotions.join(', ')}</div>}
                  {l.note && <div className="small-text">“{l.note}”</div>}
                </div>
                <button className="btn ghost small danger" onClick={() => removeLog(l.id)} aria-label="Delete log">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Mood over time</h2>
          <div className="seg" role="group" aria-label="Time range">
            {RANGES.map((r) => {
              const locked = !user.isPremium && !r.free;
              return (
                <button
                  key={r.label}
                  className={`seg-btn ${sel === r ? 'on' : ''}`}
                  disabled={locked}
                  title={locked ? 'Premium' : undefined}
                  onClick={() => setSel(r)}
                >
                  {locked && '🔒 '}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {points.length === 0 ? (
          <p className="muted">Log your mood to see your trend here.</p>
        ) : (
          <div className="chart-box">
            <Line data={lineData} options={lineOptions} />
          </div>
        )}
        {!user.isPremium && (
          <p className="notice">Weekly and monthly averages and a full year of history are part of Premium.</p>
        )}
      </div>

      <div className="card">
        <h2>Most common emotions</h2>
        {!user.isPremium ? (
          <PremiumLock>Emotion breakdowns are part of advanced mood analytics.</PremiumLock>
        ) : emotions.length === 0 ? (
          <p className="muted">Tag emotions when you log your mood to see them here.</p>
        ) : (
          <div className="chart-box pie">
            <Doughnut
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: text } } },
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
