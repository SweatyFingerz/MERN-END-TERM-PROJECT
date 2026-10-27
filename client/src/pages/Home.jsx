import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../Avatar.jsx';

export default function Home() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const sort = sp.get('sort') || 'new';
  const page = Number(sp.get('page') || 1);
  const [data, setData] = useState(null);
  const [tags, setTags] = useState([]);
  const [board, setBoard] = useState(null);
  const [err, setErr] = useState('');
  const filtered = q || tag || sort !== 'new' || page > 1;

  useEffect(() => {
    setData(null); setErr('');
    api('/questions?' + new URLSearchParams({ q, tag, sort, page })).then(setData).catch((e) => setErr(e.message));
  }, [q, tag, sort, page]);

  useEffect(() => {
    api('/questions/tags/popular').then(setTags).catch(() => {});
    api('/auth/leaderboard').then(setBoard).catch(() => {});
  }, []);

  const set = (o) => {
    const n = new URLSearchParams(sp);
    Object.entries(o).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in o)) n.delete('page');
    setSp(n);
  };

  return (
    <>
      {!filtered && (
        <section className="hero">
          <h1>Stuck on something? Ask your batch.</h1>
          <p>Post your doubt, get answers from classmates, and mark the one that fixed it.</p>
          <div className="hero-actions">
            <Link to={user ? '/ask' : '/register'} className="btn primary">{user ? 'Ask a doubt' : 'Join DoubtHub'}</Link>
            {data && <span className="muted">{data.total} {data.total === 1 ? 'doubt' : 'doubts'} asked so far</span>}
          </div>
        </section>
      )}

      <div className="home">
        <aside className="col col-left">
          <div className="panel">
            <h2>Browse</h2>
            <nav className="menu">
              <button className={!q && !tag && sort === 'new' ? 'on' : ''} onClick={() => setSp({})}>All doubts</button>
              <button className={sort === 'unanswered' ? 'on' : ''} onClick={() => set({ sort: 'unanswered' })}>Unanswered</button>
              <Link to={user ? '/ask' : '/register'}>Ask a doubt</Link>
              {user && <Link to={`/users/${user.id}`}>My profile</Link>}
            </nav>
          </div>
          {board && (
            <div className="panel">
              <h2>Community</h2>
              <div className="kpi"><span>Students</span><strong>{board.stats.users}</strong></div>
              <div className="kpi"><span>Doubts</span><strong>{board.stats.questions}</strong></div>
              <div className="kpi"><span>Answers</span><strong>{board.stats.answers}</strong></div>
            </div>
          )}
        </aside>

        <section>
          <div className="toolbar">
            <h2 className="section-title">{tag ? `Doubts tagged ${tag}` : q ? `Results for “${q}”` : sort === 'unanswered' ? 'Unanswered doubts' : 'Latest doubts'}</h2>
            <div className="tabs" role="tablist">
              <button className={sort === 'new' ? 'on' : ''} onClick={() => set({ sort: '' })}>Newest</button>
              <button className={sort === 'unanswered' ? 'on' : ''} onClick={() => set({ sort: 'unanswered' })}>Unanswered</button>
            </div>
          </div>
          {(q || tag) && <button className="link" onClick={() => setSp({})}>Clear filters</button>}
          {err && <p className="error">{err}</p>}
          {!data && !err && <p className="muted">Loading doubts…</p>}
          {data && data.items.length === 0 && (
            <div className="empty">
              <p>No doubts match yet.</p>
              <Link to="/ask" className="btn primary">Ask the first one</Link>
            </div>
          )}
          {data?.items.map((d) => (
            <article key={d._id} className={'row' + (d.acceptedAnswer ? ' is-solved' : '')}>
              <div className={'stat' + (d.acceptedAnswer ? ' solved' : '')}>
                <strong>{d.answerCount}</strong>
                <span>{d.acceptedAnswer ? 'solved' : d.answerCount === 1 ? 'answer' : 'answers'}</span>
              </div>
              <div className="row-main">
                <Link to={`/questions/${d._id}`} className="row-title">{d.title}</Link>
                <p className="snippet">{d.body.length > 140 ? d.body.slice(0, 140) + '…' : d.body}</p>
                <div className="row-foot">
                  {d.tags.map((t) => <button key={t} className="tag" onClick={() => set({ tag: t })}>{t}</button>)}
                  <span className="byline muted">
                    <Avatar name={d.author?.name} size={22} />
                    {d.author?.name || 'a deleted user'}, {timeAgo(d.createdAt)}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {data && data.pages > 1 && (
            <div className="pager">
              <button className="btn ghost" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })}>Previous</button>
              <span className="muted">Page {data.page} of {data.pages}</span>
              <button className="btn ghost" disabled={page >= data.pages} onClick={() => set({ page: String(page + 1) })}>Next</button>
            </div>
          )}
        </section>

        <aside className="col">
          <div className="panel">
            <h2>Popular tags</h2>
            {tags.length === 0 && <p className="muted">Tags appear as doubts are asked.</p>}
            <div className="tag-cloud">
              {tags.map((t) => (
                <button key={t.tag} className={'tag' + (t.tag === tag ? ' on' : '')} onClick={() => set({ tag: t.tag })}>
                  {t.tag} <small>{t.count}</small>
                </button>
              ))}
            </div>
          </div>
          {board && board.top.length > 0 && (
            <div className="panel">
              <h2>Top contributors</h2>
              <ul className="leader">
                {board.top.map((u) => (
                  <li key={u._id}>
                    <Avatar name={u.name} size={28} />
                    <Link to={`/users/${u._id}`}>{u.name}</Link>
                    <span className="rep">{u.reputation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="panel">
            <h2>How it works</h2>
            <ol className="howto">
              <li>Ask a doubt with a few tags.</li>
              <li>Classmates answer and vote.</li>
              <li>Mark the answer that solved it.</li>
              <li>Helpful answers earn reputation.</li>
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}