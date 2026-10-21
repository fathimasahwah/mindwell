import BreathingCircle from '../components/BreathingCircle.jsx';

export default function Breathe() {
  return (
    <main className="page narrow">
      <div className="card center">
        <h2>4-7-8 breathing</h2>
        <p className="muted">
          Find a comfortable position, relax your shoulders, and follow the circle.
        </p>
        <BreathingCircle />
      </div>
    </main>
  );
}
