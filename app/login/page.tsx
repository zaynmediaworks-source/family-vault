'use client';
import {FormEvent,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';

type AuthExperience={login_quote_text?:string;login_quote_author?:string;login_ticker_enabled?:boolean;login_ticker_text?:string;announcement_enabled?:boolean;announcement_title?:string;announcement_message?:string};

export default function LoginPage(){
 const router=useRouter();
 const [mode,setMode]=useState<'login'|'signup'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[passwordConfirm,setPasswordConfirm]=useState(''),[displayName,setDisplayName]=useState(''),[contactPhone,setContactPhone]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[experience,setExperience]=useState<AuthExperience>({});
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('reason')==='timeout')setMessage('Sesi berakhir karena tidak ada aktivitas. Silakan login kembali.');supabase.rpc('get_public_auth_experience').then(({data})=>{if(data)setExperience(data as AuthExperience)}).catch(()=>{})},[]);
 async function submit(e:FormEvent){
  e.preventDefault();setMessage('');setBusy(true);
  try{
   if(mode==='login'){
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
    try{await supabase.rpc('record_security_event',{p_event_type:'login_success',p_household_id:null,p_detail:{}})}catch{}
    const {data:u}=await supabase.auth.getUser();
    const [admin,aal]=await Promise.all([
      supabase.from('platform_admins').select('role').eq('user_id',u.user?.id||'').maybeSingle(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if(admin.data||(aal.data?.currentLevel==='aal1'&&aal.data?.nextLevel==='aal2'))router.replace('/security?next=/dashboard');
    else router.replace('/dashboard');
   }else{
    const cleanName=displayName.trim(),cleanPhone=contactPhone.trim();
    if(cleanName.length<2)throw new Error('Masukkan nama lengkap atau nama panggilan minimal 2 karakter.');
    if(cleanName.length>80)throw new Error('Nama maksimal 80 karakter.');
    if(cleanPhone&&(!/^[+0-9][0-9 ()-]{6,30}$/.test(cleanPhone)))throw new Error('Nomor yang bisa dihubungi belum valid.');
    if(password.length<10)throw new Error('Gunakan password minimal 10 karakter.');
    if(password!==passwordConfirm)throw new Error('Konfirmasi password belum sama.');
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:`${window.location.origin}/`,data:{display_name:cleanName,contact_phone:cleanPhone||null}}});if(error)throw error;
    if(data.session)router.replace('/family');else setMessage('Akun berhasil dibuat. Cek email untuk konfirmasi, lalu masuk dan pilih buat atau gabung Vault.');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Koneksi gagal. Silakan coba lagi.')}finally{setBusy(false)}
 }
 async function resetPassword(){
  if(!email.trim())return setMessage('Isi email terlebih dahulu.');setBusy(true);setMessage('');
  try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;setMessage('Jika email terdaftar, tautan reset password akan dikirim.')}catch(e){setMessage(e instanceof Error?e.message:'Koneksi gagal. Silakan coba lagi.')}finally{setBusy(false)}
 }
 const ticker=experience.login_ticker_text||'Welcome to Family Vault · Grow · Protect · Plan';
 return <main className="auth-experience">
   {experience.login_ticker_enabled!==false&&<div className="auth-ticker"><div className="auth-ticker-track"><span>{ticker}</span><span aria-hidden="true">{ticker}</span></div></div>}
   <section className="auth-stage">
    <div className="auth-story">
      <div className="auth-brand-row"><div className="auth-brand-mark">FV</div><div><strong>Family Vault</strong><span>Grow · Protect · Plan</span></div></div>
      <div className="auth-story-copy"><span className="auth-eyebrow">YOUR FAMILY FINANCIAL ARCHIVE</span><h1>Build the future.<br/>Protect what matters.</h1><p>Satu ruang aman untuk mengelola arus kas, investasi, tabungan, hutang, dan tujuan keluarga bersama orang yang kamu percaya.</p></div>
      <blockquote className="auth-quote"><span>“</span><p>{experience.login_quote_text||'A strong family future starts with small, consistent choices today.'}</p><footer>— {experience.login_quote_author||'Family Vault'}</footer></blockquote>
      {experience.announcement_enabled&&<div className="auth-announcement"><b>{experience.announcement_title||'Pengumuman'}</b><span>{experience.announcement_message}</span></div>}
    </div>
    <section className="auth-panel-wrap"><div className="auth-panel">
      <div className="auth-panel-head"><div className="auth-mini-mark">FV</div><div><h2>{mode==='login'?'Selamat datang kembali':'Buat ruang finansialmu'}</h2><p>{mode==='login'?'Masuk untuk melanjutkan perjalanan keluarga.':'Lengkapi profil, lalu buat Vault atau bergabung dengan Vault keluarga.'}</p></div></div>
      <div className="segmented auth-segmented"><button disabled={busy} aria-pressed={mode==='login'} className={mode==='login'?'active':''} onClick={()=>{setMode('login');setMessage('')}}>Login</button><button disabled={busy} aria-pressed={mode==='signup'} className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('')}}>Buat Akun</button></div>
      <form className="auth-form" onSubmit={submit}>{mode==='signup'&&<><label>Nama Anda<input autoComplete="name" minLength={2} maxLength={80} placeholder="Nama lengkap atau panggilan" value={displayName} onChange={e=>setDisplayName(e.target.value)} required/></label><label>Nomor yang bisa dihubungi <span className="auth-helper">(opsional)</span><input type="tel" autoComplete="tel" maxLength={31} placeholder="Contoh: +62 812 3456 7890" value={contactPhone} onChange={e=>setContactPhone(e.target.value)}/></label></>}<label>Email<input type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='signup'?10:1} placeholder="••••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{mode==='signup'&&<><label>Konfirmasi password<input type="password" autoComplete="new-password" minLength={10} placeholder="Ulangi password" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} required/></label><p className="auth-helper">Minimal 10 karakter. Gunakan password unik yang tidak dipakai di layanan lain.</p></>}<button className="auth-primary" disabled={busy}>{busy?'Memproses…':mode==='login'?'Masuk ke Family Vault':'Buat Akun'}</button></form>
      {mode==='login'&&<button className="link-btn auth-forgot" disabled={busy} onClick={resetPassword}>Lupa password?</button>}{message&&<p className="status auth-status" role="status">{message}</p>}
      <div className="auth-footnote">Secure family finance · Shared only with people you trust.</div>
    </div></section>
   </section>
 </main>;
}

