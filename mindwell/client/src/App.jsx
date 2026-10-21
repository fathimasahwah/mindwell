import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Auth from './pages/Auth.jsx';
import Journal from './pages/Journal.jsx';
import Mood from './pages/Mood.jsx';
import Breathe from './pages/Breathe.jsx';
import Settings from './pages/Settings.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Journal />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/breathe" element={<Breathe />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
