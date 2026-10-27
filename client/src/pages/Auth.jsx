import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Auth({ mode }) {
  const isReg = mode === 'register';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await (isReg ? register(form) : login(form));
      nav('/');
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{isReg ? 'Create your account' : 'Log in'}</h1>
      {err && <p className="error" role="alert">{err}</p>}
      {isReg && <label>Name<input value={form.name} onChange={set('name')} required autoComplete="name" /></label>}
      <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></label>
      <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={6}
        autoComplete={isReg ? 'new-password' : 'current-password'} /></label>
      <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Sign up' : 'Log in'}</button>
      <p className="muted">
        {isReg ? 'Already have an account? ' : 'New here? '}
        <Link to={isReg ? '/login' : '/register'}>{isReg ? 'Log in' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
