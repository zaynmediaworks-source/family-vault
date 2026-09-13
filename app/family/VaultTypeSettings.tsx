'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import styles from './family.module.css';
type R=Record<string,any>;
type VaultType='personal'|'shared';
export default function VaultTypeSettings({house,uid,members,onSaved}:{house:R|null;uid:string;members:R[];onSaved?:(type:VaultType)=>void}){
 const myRole=members.find(m=>m.user_id===uid)?.role;
 const[type,setType]=useState<VaultType>((house?.vault_type||'shared') as VaultType);
 const[msg,setMsg]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>setType((house?.vault_type||'shared') as VaultType),[house?.id,house?.vault_type]);
 if(!house)return null;
 async function save(){setBusy(true);setErr('');setMsg('');const r=await supabase.from('households').update({vault_type:type}).eq('id',house.id);setBusy(false);if(r.error)setErr(r.error.message);else{setMsg(type==='personal'?'Vault sekarang menggunakan pengalaman Personal.':'Vault sekarang menggunakan pengalaman Shared.');onSaved?.(type)}}
 const label=type==='personal'?'Personal Vault':'Shared Vault';
 return <section className={styles.card}><h2>Jenis Vault</h2><p className={styles.muted}>Jenis Vault hanya menyesuaikan identitas dan wording antarmuka. Finance, Investasi, Tabungan, Hutang, Wishlist, Otomatis, arsip, dan data yang sudah ada tetap utuh.</p>{myRole==='owner'?<><label>Tipe Vault<select value={type} onChange={e=>setType(e.target.value as VaultType)}><option value="personal">Personal Vault · untuk keuangan pribadi</option><option value="shared">Shared Vault · untuk pasangan / keluarga / bersama</option></select></label><p className={styles.muted}>Saat ini: <b>{label}</b>. Kamu dapat mengubah tipe ini kapan saja tanpa menghapus atau memindahkan data.</p><button className={styles.primary} onClick={save} disabled={busy}>{busy?'Menyimpan…':'Simpan Jenis Vault'}</button>{msg&&<div className={styles.success}>{msg}</div>}{err&&<div className={styles.error}>{err}</div>}</>:<p className={styles.muted}>Vault ini adalah <b>{label}</b>. Hanya owner / pembuat Vault yang dapat mengubah jenisnya.</p>}</section>
}
