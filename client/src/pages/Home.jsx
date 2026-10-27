import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, timeAgo } from '../api.js';

export default function Home() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const sort = sp.get('sort') || 'new';
  const page = Number(sp.get('page') || 1);
  const [data, setData] = useState(null);
  const [tags, setTags] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null); setErr('');
    api('/questions?' + new URLSearchParams({ q, tag, sort, page })).then(setData).catch((e) => setErr(e.message));
  }, [q, tag, sort, page]);

  useEffect(() => { api('/questions/tags/popular').then(setTags).catch(() => {}); }, []);

  const set = (o) => {
    const n = new URLSearchParams(sp);
    Object.entries(o).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in o)) n.delete('page');
    setSp(n);
  };

  return (
    <div className="layout">
      <section>
        <div className="toolbar">
          <h1>{tag ? `Doubts tagged ${tag}` : q ? `Results for “${q}”` : 'All doubts'}</h1>
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
          <article key={d._id} className="row">
            <div className={'stat' + (d.acceptedAnswer ? ' solved' : '')}>
              <strong>{d.answerCount}</strong>
              <span>{d.acceptedAnswer ? 'solved' : d.answerCount === 1 ? 'answer' : 'answers'}</span>
            </div>
            <div>
              <Link to={`/questions/${d._id}`} className="row-title">{d.title}</Link>
              <p className="snippet">{d.body.length > 140 ? d.body.slice(0, 140) + '…' : d.body}</p>
              <div className="row-foot">
                {d.tags.map((t) => <button key={t} className="tag" onClick={() => set({ tag: t })}>{t}</button>)}
                <span className="muted">Asked by {d.author?.name || 'a deleted user'}, {timeAgo(d.createdAt)}</span>
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
      <aside className="panel">
        <h2>Popular tags</h2>
        {tags.length === 0 && <p className="muted">Tags appear as doubts are asked.</p>}
        <div className="tag-cloud">
          {tags.map((t) => (
            <button key={t.tag} className={'tag' + (t.tag === tag ? ' on' : '')} onClick={() => set({ tag: t.tag })}>
              {t.tag} <small>{t.count}</small>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
