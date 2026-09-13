'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {browserTimeZone,DEFAULT_TIMEZONE,nowLabelInTimeZone,TIMEZONE_OPTIONS} from '@/lib/timezone';
import styles from './family.module.css';
type R=Record<string,any>;
export default function HouseholdPeriodSettings({house,uid,members,onSaved}:{house:R|null;uid:string;members:R[];onSaved?:(day:number,timezone:string)=>void}){
 const myRole=members.find(m=>m.user_id===uid)?.role;
 const[day,setDay]=useState(Number(house?.period_start_day||22));
 const[timezone,setTimezone]=useState(DEFAULT_TIMEZONE);
 const[msg,setMsg]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;setDay(Number(house?.period_start_day||22));if(!house?.id){setTimezone(DEFAULT_TIMEZONE);return()=>{alive=false}};(async()=>{const r=await supabase.from('households').select('timezone,period_start_day').eq('id',house.id).maybeSingle();if(alive&&r.data){setTimezone(r.data.timezone||DEFAULT_TIMEZONE);setDay(Number(r.data.period_start_day||house?.period_start_day||22))}})();return()=>{alive=false}},[house?.id,house?.period_start_day]);
 const options=useMemo(()=>{const detected=browserTimeZone();return TIMEZONE_OPTIONS.some(x=>x.value===detected)?TIMEZONE_OPTIONS:[{value:detected,label:`Perangkat ini · ${detected}`},...TIMEZONE_OPTIONS]},[]);
 if(!house)return null;
 const vaultLabel=house.vault_type==='personal'?'Personal Vault':'Shared Vault';
 const endDay=day===1?'hari terakhir bulan sebelumnya':`tanggal ${day-1} bulan berikutnya`;
 async function save(){setErr('');setMsg('');if(day<1||day>31){setErr('Tanggal awal periode harus antara 1–31.');return}setBusy(true);const r=await supabase.from('households').update({period_start_day:day,timezone}).eq('id',house.id);setBusy(false);if(r.error)setErr(r.error.message);else{setMsg(`Periode dimulai setiap tanggal ${day} · zona waktu ${timezone}.`);onSaved?.(day,timezone)}}
 return <section className={styles.card}><h2>Periode & Zona Waktu Vault</h2><p className={styles.muted}>Atur tanggal awal periode dan zona waktu {vaultLabel}. Seluruh “hari ini”, jatuh tempo, transaksi otomatis, dan periode mengikuti zona waktu Vault ini.</p>{myRole==='owner'?<><label>Tanggal mulai periode<input type="number" min="1" max="31" value={day} onChange={e=>setDay(Number(e.target.value||1))}/></label><label>Zona waktu<select value={timezone} onChange={e=>setTimezone(e.target.value)}>{options.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><p className={styles.muted}>Periode: tanggal <b>{day}</b> sampai <b>{endDay}</b>. Untuk bulan yang tidak memiliki tanggal 29/30/31, sistem memakai hari terakhir bulan tersebut.</p><p className={styles.muted}>Waktu Vault sekarang: <b>{nowLabelInTimeZone(timezone)}</b></p><button className={styles.primary} onClick={save} disabled={busy}>{busy?'Menyimpan…':'Simpan Periode & Zona Waktu'}</button>{msg&&<div className={styles.success}>{msg}</div>}{err&&<div className={styles.error}>{err}</div>}</>:<><p className={styles.muted}>Hanya owner / pembuat Vault yang dapat mengubah pengaturan ini.</p><p className={styles.muted}>Mulai tanggal <b>{day}</b> · zona waktu <b>{timezone}</b> · sekarang <b>{nowLabelInTimeZone(timezone)}</b></p></>}</section>
}
