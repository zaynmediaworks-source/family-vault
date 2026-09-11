'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {supabase} from '@/lib/supabase';
import SessionGuard from '@/app/components/SessionGuard';

type R=Record<string,any>;

const label:Record<string,string>={login_success:'Login berhasil',mfa_verified:'2FA diverifikasi',mfa_enrolled:'2FA diaktifkan',session_timeout:'Sesi berakhir otomatis',invite_created:'Kode undangan dibuat',household_joined:'Bergabung ke household',admin_change:'Perubahan admin',logout:'Logout'};

export default function SecurityPage(){
 const router=useRouter(),params=useSearchParams();
 const next=params.get('next')||'/dashboard';
 const [loading,setLoading]=useState(true),[err,setErr]=useState(''),[msg,setMsg]=useState('');
 const [user,setUser]=useState<R|null>(null),[isAdmin,setIsAdmin]=useState(false),[aal,setAal]=useState<R|null>(null),[factors,setFactors]=useState<R[]>([]),[events,setEvents]=useState<R[]>([]);
 const [enroll,setEnroll]=useState<R|null>(null),[code,setCode]=useState(''),[busy,setBusy]=useState(false);
 const verified=useMemo(()=>factors.filter(f=>f.status==='verified'),[factors]);

 async function reload(){
  setErr('');
  const {data:u}=await supabase.auth.getUser();
  if(!u.user){router.replace('/login');return}
  setUser(u.user);
  const [a,f,admin]=await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
    supabase.from('platform_admins').select('role').eq('user_id',u.user.id).maybeSingle(),
  ]);
  if(a.error||f.error){setErr(a.error?.message||f.error?.message||'Gagal memuat keamanan');setLoading(false);return}
  setAal(a.data);setFactors([...(f.data?.totp||[]),...(f.data?.phone||[])]);setIsAdmin(!!admin.data);
  const ev=await supabase.from('security_events').select('*').order('created_at',{ascending:false}).limit(admin.data&&a.data?.currentLevel==='aal2'?100:40);
  if(!ev.error)setEvents(ev.data||[]);
  setLoading(false);
 }
 useEffect(()=>{reload()},[]);

 async function beginEnroll(){
  setBusy(true);setErr('');setMsg('');
  const r=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Family Vault Authenticator'});
  if(r.error)setErr(r.error.message);else{setEnroll(r.data);setCode('')}
  setBusy(false);
 }
 async function verifyFactor(e:FormEvent){
  e.preventDefault(); if(!code.trim())return;
  setBusy(true);setErr('');setMsg('');
  const factorId=enroll?.id||verified[0]?.id;
  if(!factorId){setErr('Faktor 2FA tidak ditemukan.');setBusy(false);return}
  const r=await supabase.auth.mfa.challengeAndVerify({factorId,code:code.trim()});
  if(r.error){setErr(r.error.message);setBusy(false);return}
  await supabase.rpc('record_security_event',{p_event_type:enroll?'mfa_enrolled':'mfa_verified',p_household_id:null,p_detail:{method:'totp'}});
  setEnroll(null);setCode('');setMsg('Verifikasi berhasil. Sesi ini sekarang menggunakan AAL2.');setBusy(false);await reload();
 }
 async function removeFactor(id:string){
  if(!window.confirm('Nonaktifkan faktor 2FA ini?'))return;
  setBusy(true);setErr('');
  const r=await supabase.auth.mfa.unenroll({factorId:id});
  if(r.error)setErr(r.error.message);else{setMsg('Faktor 2FA dinonaktifkan.');await reload()}
  setBusy(false);
 }
 async function signOut(){
  try{await supabase.rpc('record_security_event',{p_event_type:'logout',p_household_id:null,p_detail:{}})}catch{}
  await supabase.auth.signOut();router.replace('/login');
 }

 if(loading)return <main className="security-shell"><SessionGuard minutes={20}/><div className="security-card">Memuat pusat keamanan…</div></main>;
 const needsChallenge=verified.length>0&&aal?.currentLevel!=='aal2';
 const adminNeedsSetup=isAdmin&&verified.length===0;
 return <main className="security-shell"><SessionGuard minutes={20}/>
  <header className="security-hero"><div><div className="kicker">Security Center</div><h1>Keamanan Family Vault</h1><p>2FA, status sesi, dan aktivitas keamanan akun.</p></div><div className="security-actions"><Link className="btn alt" href="/dashboard">Dashboard</Link>{isAdmin&&<Link className="btn alt" href="/admin">Admin</Link>}<button className="icon" onClick={signOut}>Keluar</button></div></header>
  {err&&<div className="security-alert danger-box">{err}</div>}{msg&&<div className="security-alert success-box">{msg}</div>}
  <section className="security-grid">
   <article className="security-card security-status-card"><div className="security-icon">🔐</div><div><div className="kicker">Authenticator Assurance</div><h2>{aal?.currentLevel==='aal2'?'AAL2 · Terverifikasi':'AAL1 · Password saja'}</h2><p>{isAdmin?'Admin wajib memakai 2FA sebelum mengakses data admin.':'Aktifkan 2FA untuk perlindungan tambahan.'}</p></div><span className={`security-badge ${aal?.currentLevel==='aal2'?'secure':'warn'}`}>{aal?.currentLevel==='aal2'?'Secure':'Action needed'}</span></article>
   <article className="security-card"><div className="kicker">Session</div><h2>Sesi aktif</h2><div className="security-row"><span>Akun</span><b>{user?.email}</b></div><div className="security-row"><span>Timeout tidak aktif</span><b>{isAdmin?'20 menit':'60 menit'}</b></div><div className="security-row"><span>Level</span><b>{aal?.currentLevel||'aal1'}</b></div></article>
  </section>

  <section className="security-card">
   <div className="security-title"><div><div className="kicker">Two-factor authentication</div><h2>Authenticator App</h2></div>{verified.length===0&&!enroll&&<button className="btn" disabled={busy} onClick={beginEnroll}>Aktifkan 2FA</button>}</div>
   {adminNeedsSetup&&!enroll&&<div className="security-alert warn-box">Akun admin harus mengaktifkan 2FA sebelum Admin Panel dapat dibuka.</div>}
   {enroll&&<div className="mfa-setup"><div className="qr-box">{enroll.totp?.qr_code?<img src={enroll.totp.qr_code} alt="QR code TOTP"/>:<div>QR tidak tersedia</div>}</div><div><h3>Scan QR dengan authenticator app</h3><p className="muted">Gunakan Google Authenticator, Microsoft Authenticator, 1Password, atau aplikasi TOTP lain.</p><div className="secret-box"><span>Secret key</span><code>{enroll.totp?.secret}</code></div><form onSubmit={verifyFactor}><label>Kode 6 digit<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" required/></label><button className="btn" disabled={busy||code.length<6}>Verifikasi & Aktifkan</button></form></div></div>}
   {needsChallenge&&!enroll&&<div className="mfa-challenge"><div><h3>Masukkan kode authenticator</h3><p className="muted">2FA sudah terdaftar. Verifikasi sesi ini untuk melanjutkan.</p></div><form onSubmit={verifyFactor}><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6 digit"/><button className="btn" disabled={busy||code.length<6}>Verifikasi</button></form></div>}
   {verified.length>0&&<div className="factor-list">{verified.map(f=><div key={f.id}><div><b>{f.friendly_name||'Authenticator'}</b><span>Terdaftar · {f.factor_type||'TOTP'}</span></div><button className="icon danger" disabled={busy||isAdmin&&verified.length===1} title={isAdmin&&verified.length===1?'Admin wajib memiliki minimal satu faktor 2FA':''} onClick={()=>removeFactor(f.id)}>Nonaktifkan</button></div>)}</div>}
   {aal?.currentLevel==='aal2'&&<div className="continue-line"><span>✓ Sesi aman dengan 2FA.</span><button className="btn" onClick={()=>router.push(next)}>Lanjutkan</button></div>}
  </section>

  <section className="security-card"><div className="security-title"><div><div className="kicker">Activity</div><h2>{isAdmin&&aal?.currentLevel==='aal2'?'Security Activity Platform':'Aktivitas Keamanan Saya'}</h2></div><span>{events.length} event</span></div><div className="security-timeline">{events.length===0?<p className="muted">Belum ada aktivitas keamanan.</p>:events.map(e=><div className="security-event" key={e.id}><div className="event-dot"/><div><b>{label[e.event_type]||e.event_type}</b><p>{new Date(e.created_at).toLocaleString('id-ID')}</p>{e.detail&&Object.keys(e.detail).length>0&&<small>{JSON.stringify(e.detail)}</small>}</div></div>)}</div></section>
 </main>
}
