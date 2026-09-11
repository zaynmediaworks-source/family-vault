'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,loadActivity} from './activity';
import styles from './family.module.css';
type R=Record<string,any>;
const dt=(s:string)=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s));
export default function ActivityPanel({hid,uid,email,name,profiles}:{hid:string;uid:string;email:string;name:string;profiles:R[]}){
 const [rows,setRows]=useState<Activity[]>([]),[busy,setBusy]=useState(false);
 const profileMap=useMemo(()=>Object.fromEntries(profiles.map(p=>[p.id,p])),[profiles]);
 const actor=(id:string|null)=>{if(!id)return 'Data lama';const p=profileMap[id];return p?.display_name||p?.email||(id===uid?(name||email):'Anggota keluarga')};
 async function refresh(){if(!hid)return;setBusy(true);setRows(await loadActivity(hid));setBusy(false)}
 useEffect(()=>{refresh()},[hid]);
 if(!hid)return null;
 return <section className={styles.card}><div className={styles.sectionHead}><div><h2>History Input</h2><p className={styles.muted}>Riwayat siapa yang membuat catatan terbaru.</p></div><button className={styles.secondary} onClick={refresh} disabled={busy}>{busy?'Memuat…':'Refresh'}</button></div><div className={styles.timeline}>{rows.length?rows.map(a=><div className={styles.activity} key={a.id}><div className={styles.dot}/><div><div className={styles.activityTop}><b>{a.kind}</b><span>{dt(a.created_at)}</span></div><strong>{a.title}</strong>{a.detail&&<p>{a.detail}</p>}<small>Diinput oleh <b>{actor(a.created_by)}</b></small></div></div>):<p className={styles.muted}>Belum ada aktivitas yang tercatat.</p>}</div></section>
}
