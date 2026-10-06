'use client';

import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

export default function LaunchReadinessPanel(){
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);setError('');
    try{
      const {data:s}=await supabase.auth.getSession();
      const token=s.session?.access_token;
      if(!token)throw new Error('Admin session unavailable');
      const res=await fetch('/api/admin/provider-status',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      const body=await res.json();
      if(!res.ok||!body.ok)throw new Error(body.error||'Provider status unavailable');
      setData(body);
    }catch(err){setError(String(err?.message||err))}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);
  const checks=useMemo(()=>Object.values(data?.checks||{}),[data]);
  const ready=checks.filter(x=>x.ready).length;
  const total=checks.length;

  return <section id="launch-readiness" className="adminSection">
    <div className="sectionLabel"><span>15 / LAUNCH READINESS</span><p>Provider and production-domain status. Secrets are never displayed.</p></div>
    <div className="adminPanel launchReadinessPanel">
      <header><div><span>PRODUCTION GATES</span><strong>{loading?'…':total?ready+'/'+total:'—'}</strong></div><button type="button" className="ghostButton" onClick={load} disabled={loading}>{loading?'CHECKING…':'REFRESH'}</button></header>
      {error&&<p className="dbNotice">{error}</p>}
      <div className="launchReadinessGrid">
        {checks.map(x=><article key={x.label} className={x.ready?'ready':'pending'}>
          <div><i>{x.ready?'✓':'○'}</i><b>{x.label}</b></div>
          <span>{x.ready?'READY':'PENDING'}</span>
          <p>{x.detail}</p>
        </article>)}
      </div>
      {!loading&&total>0&&ready<total&&<small className="launchReadinessNote">Provider-dependent items stay pending until the real domain and selected production services are connected.</small>}
    </div>
  </section>;
}
