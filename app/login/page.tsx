'use client';
import {FormEvent,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';
export default function LoginPage(){
 const router=useRouter();
 const [mode,setMode]=useState<'login'|'signup'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('reason')==='timeout')setMessage('Sesi berakhir karena tidak ada aktivitas. Silakan login kembali.')},[]);
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
    if(password.length<10)throw new Error('Gunakan password minimal 10 karakter.');
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:`${window.location.origin}/`}});if(error)throw error;
    if(data.session)router.replace('/dashboard');else setMessage('Cek email untuk mengonfirmasi akun, lalu masuk ke Family Vault.');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Koneksi gagal. Silakan coba lagi.')}finally{setBusy(false)}
 }
 async function resetPassword(){
  if(!email.trim())return setMessage('Isi email terlebih dahulu.');setBusy(true);setMessage('');
  try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;setMessage('Jika email terdaftar, tautan reset password akan dikirim.')}catch(e){setMessage(e instanceof Error?e.message:'Koneksi gagal. Silakan coba lagi.')}finally{setBusy(false)}
 }
 return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><p className="muted">Secure family finance, shared with the people you trust.</p><div className="segmented"><button disabled={busy} aria-pressed={mode==='login'} className={mode==='login'?'active':''} onClick={()=>{setMode('login');setMessage('')}}>Login</button><button disabled={busy} aria-pressed={mode==='signup'} className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('')}}>Buat Akun</button></div><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='signup'?10:1} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{mode==='signup'&&<p className="muted small">Minimal 10 karakter. Gunakan password unik yang tidak dipakai di layanan lain.</p>}<button className="primary" disabled={busy}>{busy?'Memproses…':mode==='login'?'Masuk':'Buat Akun'}</button></form>{mode==='login'&&<button className="link-btn" disabled={busy} onClick={resetPassword}>Lupa password?</button>}{message&&<p className="status" role="status">{message}</p>}</section></main>;
}
