export const MUSIC_DAYS = [['Mon','Senin'],['Tue','Selasa'],['Wed','Rabu'],['Thu','Kamis'],['Fri','Jumat'],['Sat','Sabtu'],['Sun','Minggu']] as const;
export function dailyMusicTrack<T extends {id:string;enabled?:boolean}>(tracks:T[],settings:{daily_schedule?:Record<string,string>;daily_timezone?:string;daily_track_id?:string},now=new Date()):T|undefined{
  const zone=['Asia/Jakarta','Asia/Makassar','Asia/Jayapura'].includes(settings.daily_timezone||'')?settings.daily_timezone!:'Asia/Makassar';
  const day=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:zone}).format(now);
  const enabled=tracks.filter(t=>t.enabled!==false);
  return enabled.find(t=>t.id===settings.daily_schedule?.[day])||enabled.find(t=>t.id===settings.daily_track_id)||enabled[0];
}
