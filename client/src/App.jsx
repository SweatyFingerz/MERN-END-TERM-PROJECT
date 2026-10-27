import { useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Home from './pages/Home.jsx';
import Ask from './pages/Ask.jsx';
import Question from './pages/Question.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import Avatar from './Avatar.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const search = (e) => { e.preventDefault(); nav(`/?q=${encodeURIComponent(q)}`); };
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link to="/" className="logo"><span>Doubt</span>Hub</Link>
        <form onSubmit={search} className="search" role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search doubts" aria-label="Search doubts" />
        </form>
        <nav className="nav">
          {user ? (
            <>
              <Link to="/ask" className="btn primary">Ask a doubt</Link>
              <Link to={`/users/${user.id}`} className="nav-user"><Avatar name={user.name} size={28} />{user.name}</Link>
              <button className="btn ghost" onClick={() => { logout(); nav('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost">Log in</Link>
              <Link to="/register" className="btn primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/ask" element={<Protected><Ask /></Protected>} />
          <Route path="/questions/:id" element={<Question />} />
          <Route path="/questions/:id/edit" element={<Protected><Ask /></Protected>} />
          <Route path="/users/:id" element={<Profile />} />
          <Route path="*" element={<p className="muted">Page not found. <Link to="/">Back to all doubts</Link></p>} />
        </Routes>
      </main>
      <footer className="footer">DoubtHub: a place for students to ask, answer and learn together.</footer>
    </>
  );
}
