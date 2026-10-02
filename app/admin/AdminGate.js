'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setMessage('Supabase environment variables are missing.');
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setUser(error ? null : data?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(event) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) setMessage(error.message);
  }

  async function logout() {
    if (!supabase) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    setSubmitting(false);
    if (error) setMessage(error.message);
  }

  if (loading) {
    return <main className="adminAuth"><div className="authCard"><span>SIDE:II / CONTROL ROOM</span><h1>Checking <em>session.</em></h1></div></main>;
  }

  if (!user) {
    return <main className="adminAuth"><form className="authCard" onSubmit={login}>
      <span>SIDE:II / ADMINISTRATION</span>
      <h1>Control <em>room.</em></h1>
      <p>Authorised access only.</p>
      <label><span>EMAIL</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label><span>PASSWORD</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      {message && <p className="authMessage">{message}</p>}
      <button className="saveButton" type="submit" disabled={submitting}>{submitting ? 'SIGNING IN…' : 'ENTER CONTROL ROOM →'}</button>
    </form></main>;
  }

  return <>
    <div className="adminSession"><span>{user.email}</span><button type="button" onClick={logout} disabled={submitting}>SIGN OUT ↗</button></div>
    {children}
  </>;
}
