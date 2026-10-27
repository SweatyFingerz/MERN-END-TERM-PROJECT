import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function Ask() {
  const { id } = useParams(); // present when editing
  const nav = useNavigate();
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api('/questions/' + id)
      .then((q) => setForm({ title: q.title, body: q.body, tags: q.tags.join(', ') }))
      .catch((e) => setErr(e.message));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const q = await api(id ? '/questions/' + id : '/questions', { method: id ? 'PUT' : 'POST', body: form });
      nav('/questions/' + q._id);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <form className="panel narrow wide" onSubmit={submit}>
      <h1>{id ? 'Edit your doubt' : 'Ask a doubt'}</h1>
      {err && <p className="error" role="alert">{err}</p>}
      <label>Title
        <input value={form.title} onChange={set('title')} placeholder="Summarise it in one line" maxLength={150} required />
      </label>
      <label>Details
        <textarea rows={8} value={form.body} onChange={set('body')} placeholder="What have you tried? What did you expect to happen?" required />
      </label>
      <label>Tags
        <input value={form.tags} onChange={set('tags')} placeholder="react, hooks, mongodb (up to 5, comma separated)" />
      </label>
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Post doubt'}</button>
    </form>
  );
}
