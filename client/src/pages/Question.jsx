import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../Avatar.jsx';

export default function Question() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState(null);
  const [err, setErr] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQ(null);
    api('/questions/' + id).then(setQ).catch((e) => setErr(e.message));
  }, [id, user?.id]);

  // Run an action that returns the updated question
  const act = async (fn) => {
    setErr('');
    try { setQ(await fn()); } catch (e) { setErr(e.message); }
  };
  const vote = (a, value) => {
    if (!user) return nav('/login');
    act(() => api(`/questions/${id}/answers/${a._id}/vote`, { method: 'POST', body: { value } }));
  };
  const accept = (a) => act(() => api(`/questions/${id}/answers/${a._id}/accept`, { method: 'POST' }));
  const delAnswer = (a) => window.confirm('Delete this answer?') &&
    act(() => api(`/questions/${id}/answers/${a._id}`, { method: 'DELETE' }));
  const delQuestion = async () => {
    if (!window.confirm('Delete this doubt and all its answers?')) return;
    try { await api('/questions/' + id, { method: 'DELETE' }); nav('/'); } catch (e) { setErr(e.message); }
  };
  const post = async (e) => {
    e.preventDefault();
    setBusy(true);
    await act(() => api(`/questions/${id}/answers`, { method: 'POST', body: { body } }).then((r) => { setBody(''); return r; }));
    setBusy(false);
  };

  if (!q) return err ? <p className="error">{err} <Link to="/">Back to all doubts</Link></p> : <p className="muted">Loading doubt…</p>;
  const mine = user?.id === q.author?._id;

  return (
    <div className="narrow wide">
      <h1>{q.title}</h1>
      <p className="muted byline"><Avatar name={q.author?.name} size={24} /> Asked by {q.author ? <Link to={`/users/${q.author._id}`}>{q.author.name}</Link> : 'a deleted user'}, {timeAgo(q.createdAt)}</p>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="panel">
        <p className="body-text">{q.body}</p>
        <div className="row-foot">
          {q.tags.map((t) => <Link key={t} className="tag" to={`/?tag=${t}`}>{t}</Link>)}
          {mine && (
            <span className="actions">
              <Link to={`/questions/${q._id}/edit`} className="link">Edit</Link>
              <button className="link danger" onClick={delQuestion}>Delete</button>
            </span>
          )}
        </div>
      </div>

      <h2>{q.answers.length} {q.answers.length === 1 ? 'answer' : 'answers'}</h2>
      {q.answers.length === 0 && <p className="muted">No answers yet. Be the first to help.</p>}
      {q.answers.map((a) => {
        const solved = String(q.acceptedAnswer) === String(a._id);
        const own = user?.id === a.author?._id;
        return (
          <div key={a._id} className={'answer' + (solved ? ' solved' : '')}>
            <div className="votes">
              <button aria-label="Upvote" className={a.myVote === 1 ? 'on' : ''} disabled={own} onClick={() => vote(a, 1)}>▲</button>
              <strong>{a.score}</strong>
              <button aria-label="Downvote" className={a.myVote === -1 ? 'on' : ''} disabled={own} onClick={() => vote(a, -1)}>▼</button>
            </div>
            <div>
              {solved && <span className="mark">Solution</span>}
              <p className="body-text">{a.body}</p>
              <div className="row-foot">
                <span className="muted byline">
                  <Avatar name={a.author?.name} size={22} />
                  {a.author ? <Link to={`/users/${a.author._id}`}>{a.author.name}</Link> : 'a deleted user'}
                  {a.author && ` (${a.author.reputation} rep)`}, {timeAgo(a.createdAt)}
                </span>
                <span className="actions">
                  {mine && <button className="link" onClick={() => accept(a)}>{solved ? 'Remove solution' : 'Mark as solution'}</button>}
                  {own && <button className="link danger" onClick={() => delAnswer(a)}>Delete</button>}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {user ? (
        <form onSubmit={post} className="panel">
          <h2>Your answer</h2>
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Explain it the way you would to a classmate" required />
          <button className="btn primary" disabled={busy}>{busy ? 'Posting…' : 'Post answer'}</button>
        </form>
      ) : (
        <p className="panel"><Link to="/login">Log in</Link> to answer this doubt.</p>
      )}
    </div>
  );
}
