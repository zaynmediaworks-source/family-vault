'use client';
import {FormEvent,useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';

export default function ResetPasswordPage(){
 const[ready,setReady]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[message,setMessage]=useState('Memeriksa tautan reset…');

 useEffect(()=>{
  let alive=true;
  const markReady=()=>{if(!alive)return;setReady(true);setMessage('Tautan valid. Masukkan password baru.')};
  const markError=(text='Tautan tidak valid atau sudah kedaluwarsa. Minta tautan reset baru dari halaman login.')=>{if(!alive)return;setReady(false);setMessage(text)};

  const {data:listener}=supabase.auth.onAuthStateChange((event,session)=>{
   if((event==='PASSWORD_RECOVERY'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session)markReady();
  });

  (async()=>{
   try{
    const url=new URL(window.location.href);
    const code=url.searchParams.get('code');
    if(code){
     const {error}=await supabase.auth.exchangeCodeForSession(code);
     if(error){markError(error.message);return}
     window.history.replaceState({},'',url.pathname);
     markReady();return;
    }

    // For the implicit recovery flow Supabase reads the access token from the URL hash.
    // Give the client a moment to persist that recovery session before checking it.
    for(let i=0;i<6;i++){
     const {data,error}=await supabase.auth.getSession();
     if(!error&&data.session){markReady();return}
     await new Promise(r=>setTimeout(r,250));
    }
    markError();
   }catch(e){markError(e instanceof Error?e.message:'Koneksi gagal. Coba buka kembali tautan reset.')}
  })();

  return()=>{alive=false;listener.subscription.unsubscribe()};
 },[]);

 async function submit(e:FormEvent){
  e.preventDefault();setMessage('');
  if(password.length<10)return setMessage('Gunakan password minimal 10 karakter.');
  if(password!==confirm)return setMessage('Kedua password harus sama.');
  setBusy(true);
  try{
   const {data:sessionData}=await supabase.auth.getSession();
   if(!sessionData.session)throw new Error('Sesi reset sudah berakhir. Minta tautan reset baru.');
   const {error}=await supabase.auth.updateUser({password});
   if(error)throw error;
   await supabase.auth.signOut();
   setDone(true);setReady(false);setPassword('');setConfirm('');setMessage('Password berhasil diperbarui. Silakan login menggunakan password baru.');
  }catch(e){setMessage(e instanceof Error?e.message:'Password belum bisa diperbarui. Silakan coba lagi.')}
  finally{setBusy(false)}
 }

 return <main className="center"><section className="auth-card"><div className="logo">Family Vault</div><h1>Atur password baru</h1><p role="status" className={done?'status success':'muted'}>{message}</p>{ready&&!done&&<form onSubmit={submit}><label>Password baru<input autoComplete="new-password" type="password" minLength={10} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 10 karakter"/></label><label>Konfirmasi password<input autoComplete="new-password" type="password" minLength={10} required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Ulangi password baru"/></label><button className="primary" disabled={busy}>{busy?'Menyimpan…':'Simpan password baru'}</button></form>}<p><Link href="/login">Kembali ke login</Link></p></section></main>;
}
