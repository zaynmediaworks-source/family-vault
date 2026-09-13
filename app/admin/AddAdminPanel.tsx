'use client';
import {FormEvent,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export default function AddAdminPanel(){
 const[owner,setOwner]=useState(false),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setOwner(data.user?.id==='459cd4b7-a14d-4604-b06d-1eea3ba90c70'))},[]);
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{const{error}=await supabase.rpc('add_platform_admin',{p_email:email.trim()});if(error)throw error;setMessage('Akun tersebut sekarang memiliki akses Admin.');setEmail('')}catch(e){setMessage(e instanceof Error?e.message:'Gagal menambah Admin.')}finally{setBusy(false)}}
 if(!owner)return null;
 return <section className="admin-section"><div className="admin-title"><h2>Tambah Admin</h2></div><form className="admin-card" onSubmit={submit}><p>Akun yang ditambahkan dapat mengelola platform dan melihat data seluruh Vault. Hanya akunmu yang dapat menambahkan Admin.</p><label>Email akun yang sudah terdaftar<input type="email" value={email} required onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com"/></label><button className="btn" disabled={busy}>{busy?'Memproses…':'Jadikan Admin'}</button>{message&&<p role="status">{message}</p>}</form></section>;
}


