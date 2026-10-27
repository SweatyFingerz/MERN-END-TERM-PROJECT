import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, timeAgo } from '../api.js';

export default function Profile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null);
    api('/auth/users/' + id).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="muted">Loading profile…</p>;
  const { user, questions, answeredCount } = data;

  return (
    <div className="narrow wide">
      <h1>{user.name}</h1>
      <div className="stats">
        <div className="panel"><strong>{user.reputation}</strong><span>reputation</span></div>
        <div className="panel"><strong>{questions.length}</strong><span>doubts asked</span></div>
        <div className="panel"><strong>{answeredCount}</strong><span>doubts answered</span></div>
      </div>
      <p className="muted">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
      <h2>Doubts asked</h2>
      {questions.length === 0 && <p className="muted">Nothing asked yet.</p>}
      {questions.map((d) => (
        <article key={d._id} className="row">
          <div className={'stat' + (d.acceptedAnswer ? ' solved' : '')}>
            <strong>{d.answerCount}</strong><span>{d.acceptedAnswer ? 'solved' : 'answers'}</span>
          </div>
          <div>
            <Link to={`/questions/${d._id}`} className="row-title">{d.title}</Link>
            <p className="muted">{timeAgo(d.createdAt)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
