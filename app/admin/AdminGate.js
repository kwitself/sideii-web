'use client';

import { useEffect, useState } from 'react';
import {isAdminUser} from '../lib/adminSafety';
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
    let verification = 0, refreshTimer;
    if (!supabase) {
      setMessage('Supabase environment variables are missing.');
      setLoading(false);
      return;
    }

    const verify = () => {
    const request = ++verification;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active || request !== verification) return;
      setUser(error ? null : data?.user ?? null);
      setLoading(false);
    }).catch(() => { if (active && request === verification) { setUser(null); setMessage('Session could not be verified. Please sign in again.'); setLoading(false); } });
    };
    verify();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) { ++verification; setUser(null); setLoading(false); return; }
      if (_event === 'INITIAL_SESSION') return;
      setLoading(true);
      clearTimeout(refreshTimer);
      // Defer auth calls until Supabase releases its auth-state callback lock.
      refreshTimer = setTimeout(verify, 0);
    });

    return () => {
      active = false;
      clearTimeout(refreshTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(event) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setMessage('');
    try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) setMessage(error.message);
    } catch { setMessage('Sign in failed. Please try again.'); } finally { setSubmitting(false); }
  }

  async function logout() {
    if (!supabase) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) setMessage(error.message);
    } catch { setMessage('Sign out failed. Please try again.'); }
    finally { setSubmitting(false); }
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

  if (!isAdminUser(user)) return <main className="adminAuth"><section className="authCard" role="alert"><span>SIDE:II / ADMINISTRATION</span><h1>Access <em>restricted.</em></h1><p>This account does not have administrator access.</p><button type="button" className="saveButton" onClick={logout} disabled={submitting}>SIGN OUT</button>{message&&<p>{message}</p>}</section></main>;

  return <>
    <div className="adminSession"><span>{user.email}</span><button type="button" onClick={logout} disabled={submitting}>SIGN OUT ↗</button></div>
    {children}
  </>;
}
