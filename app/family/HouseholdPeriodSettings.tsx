'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import styles from './family.module.css';
type R=Record<string,any>;
export default function HouseholdPeriodSettings({house,uid,members,onSaved}:{house:R|null;uid:string;members:R[];onSaved?:(day:number)=>void}){
 const myRole=members.find(m=>m.user_id===uid)?.role;
 const[day,setDay]=useState(Number(house?.period_start_day||22));
 const[msg,setMsg]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>setDay(Number(house?.period_start_day||22)),[house?.id,house?.period_start_day]);
 if(!house)return null;
 const endDay=day===1?'hari terakhir bulan sebelumnya':`tanggal ${day-1} bulan berikutnya`;
 async function save(){setErr('');setMsg('');if(day<1||day>31){setErr('Tanggal awal periode harus antara 1–31.');return}setBusy(true);const r=await supabase.from('households').update({period_start_day:day}).eq('id',house.id);setBusy(false);if(r.error)setErr(r.error.message);else{setMsg(`Periode household dimulai setiap tanggal ${day}.`);onSaved?.(day)}}
 return <section className={styles.card}><h2>Periode Keuangan Household</h2><p className={styles.muted}>Atur berdasarkan tanggal gajian keluarga. Contoh: mulai tanggal 22 berarti periode berjalan dari 22 bulan ini sampai 21 bulan berikutnya.</p>{myRole==='owner'?<><label>Tanggal mulai periode<input type="number" min="1" max="31" value={day} onChange={e=>setDay(Number(e.target.value||1))}/></label><p className={styles.muted}>Periode: tanggal <b>{day}</b> sampai <b>{endDay}</b>. Untuk bulan yang tidak memiliki tanggal 29/30/31, sistem otomatis memakai hari terakhir bulan tersebut.</p><button className={styles.primary} onClick={save} disabled={busy}>{busy?'Menyimpan…':'Simpan Periode'}</button>{msg&&<div className={styles.success}>{msg}</div>}{err&&<div className={styles.error}>{err}</div>}</>:<p className={styles.muted}>Hanya owner / pembuat household yang dapat mengubah periode keuangan. Saat ini mulai tanggal <b>{day}</b>.</p>}</section>
}
