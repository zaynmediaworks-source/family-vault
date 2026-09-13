'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '@/lib/supabase';
export default function MusicPlayer(){
 const path=usePathname(),audio=useRef<HTMLAudioElement|null>(null),uid=useRef(''),wanted=useRef(true);
 const[tracks,setTracks]=useState<any[]>([]),[settings,setSettings]=useState<any>(null),[index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[volume,setVolume]=useState(.3),[message,setMessage]=useState('');
 const hidden=['/login','/reset-password','/'].includes(path);
 useEffect(()=>{let alive=true;
 async function sync(){const{data}=await supabase.auth.getSession();const id=data.session?.user.id||'';if(!alive)return;
 if(id!==uid.current){uid.current=id;wanted.current=!!id&&localStorage.getItem('fv-music-off:'+id)!=='1';const v=Number(localStorage.getItem('fv-music-volume:'+id)??.3);setVolume(Number.isFinite(v)?Math.min(1,Math.max(0,v)):.3);}
 if(!id){audio.current?.pause();setSettings(null);setTracks([]);return;}
 const[a,b]=await Promise.all([supabase.from('music_tracks').select('*').eq('enabled',true).order('sort_order').order('created_at'),supabase.from('music_settings').select('*').single()]);
 if(!alive)return;if(a.error||b.error){audio.current?.pause();setSettings(null);return;}
 setTracks(old=>JSON.stringify(old)===JSON.stringify(a.data)?old:a.data||[]);
 setSettings((old:any)=>JSON.stringify(old)===JSON.stringify(b.data)?old:b.data);
 }
 void sync();const timer=setInterval(sync,30000);const refresh=()=>void sync();window.addEventListener('fv-music-refresh',refresh);
 const{data:sub}=supabase.auth.onAuthStateChange((event,session)=>{if(!session){audio.current?.pause();setSettings(null)}setTimeout(refresh,0)});
 return()=>{alive=false;clearInterval(timer);window.removeEventListener('fv-music-refresh',refresh);sub.subscription.unsubscribe()};
 },[]);
 const track=settings?.mode==='daily'?(tracks.find(t=>t.id===settings.daily_track_id)||tracks[0]):tracks[index%Math.max(1,tracks.length)];
 const available=!!settings?.enabled&&!!track&&!hidden;
 useEffect(()=>{const a=audio.current;if(!a)return;if(!available){a.pause();return}setMessage('');if(wanted.current)a.play().catch(()=>setMessage('Tekan Putar Musik untuk mulai.'));},[available,track?.url]);
 useEffect(()=>{if(audio.current)audio.current.volume=volume},[volume]);
 function toggle(){const a=audio.current;if(!a)return;if(playing){wanted.current=false;localStorage.setItem('fv-music-off:'+uid.current,'1');a.pause();}else{wanted.current=true;localStorage.removeItem('fv-music-off:'+uid.current);a.play().then(()=>setMessage('')).catch(()=>setMessage('Audio belum dapat diputar. Coba lagu berikutnya atau periksa URL audio.'));}}
 return <><audio ref={audio} src={available?track?.url:undefined} preload="none" loop={settings?.mode==='daily'||tracks.length===1} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{if(settings?.mode==='playlist')setIndex(i=>(i+1)%tracks.length)}} onError={()=>setMessage('Lagu tidak dapat dimuat. Coba lagu berikutnya.')} />{available&&<aside className="fv-music-player" aria-label="Pemutar musik"><div><small>{settings.mode==='daily'?'Music of the Day':'Playlist Family Vault'}</small><strong>{track.title}</strong><small>{track.artist}</small></div><button type="button" onClick={toggle}>{playing?'Pause':'Putar Musik'}</button>{settings.mode==='playlist'&&tracks.length>1&&<button type="button" aria-label="Lagu berikutnya" onClick={()=>setIndex(i=>(i+1)%tracks.length)}>▶▶</button>}<label>Volume<input aria-label="Volume musik" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);localStorage.setItem('fv-music-volume:'+uid.current,String(v))}}/></label><button type="button" onClick={()=>{wanted.current=false;localStorage.setItem('fv-music-off:'+uid.current,'1');audio.current?.pause();setMessage('Musik dimatikan. Tekan Putar Musik untuk mengaktifkan.')}}>Matikan</button>{message&&<small role="status">{message}</small>}</aside>}</>
}


