export const DEFAULT_TIMEZONE='Asia/Makassar';

export const TIMEZONE_OPTIONS=[
  {value:'Asia/Jakarta',label:'WIB · Jakarta / Sumatra / Jawa'},
  {value:'Asia/Makassar',label:'WITA · Kalimantan / Bali / Sulawesi'},
  {value:'Asia/Jayapura',label:'WIT · Papua / Maluku'},
  {value:'Asia/Singapore',label:'Singapore'},
  {value:'Asia/Kuala_Lumpur',label:'Kuala Lumpur'},
  {value:'UTC',label:'UTC'},
];

const pad=(n:number)=>String(n).padStart(2,'0');

export function todayInTimeZone(timeZone=DEFAULT_TIMEZONE,date=new Date()){
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }catch{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:DEFAULT_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }
}

export function nowLabelInTimeZone(timeZone=DEFAULT_TIMEZONE,date=new Date()){
  try{return new Intl.DateTimeFormat('id-ID',{timeZone,dateStyle:'full',timeStyle:'short'}).format(date)}
  catch{return new Intl.DateTimeFormat('id-ID',{timeZone:DEFAULT_TIMEZONE,dateStyle:'full',timeStyle:'short'}).format(date)}
}

export function dateParts(date:string){
  const [year,month,day]=date.split('-').map(Number);
  return{year,month,day};
}

function daysInMonth(year:number,month1:number){return new Date(Date.UTC(year,month1,0)).getUTCDate()}
export function safeDateString(year:number,month1:number,day:number){return `${year}-${pad(month1)}-${pad(Math.min(Math.max(day,1),daysInMonth(year,month1)))}`}
export function addDays(date:string,days:number){const {year,month,day}=dateParts(date);const d=new Date(Date.UTC(year,month-1,day+days));return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`}

export function periodKeyForDate(date:string,startDay:number){
  const {year,month}=dateParts(date);let y=year,m=month;
  const start=safeDateString(y,m,startDay||22);
  if(date<start){m--;if(m<1){m=12;y--}}
  return `${y}-${pad(m)}`;
}

export function periodBounds(key:string,startDay:number){
  const [year,month]=key.split('-').map(Number);
  const start=safeDateString(year,month,startDay||22);
  const ny=month===12?year+1:year,nm=month===12?1:month+1;
  const end=safeDateString(ny,nm,startDay||22);
  return{start,end,last:addDays(end,-1)};
}

export function currentPeriodBounds(startDay:number,timeZone=DEFAULT_TIMEZONE,date=new Date()){
  const today=todayInTimeZone(timeZone,date);
  return periodBounds(periodKeyForDate(today,startDay),startDay);
}

export function formatDateOnly(date:string,locale='id-ID'){
  const {year,month,day}=dateParts(date);
  return new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));
}

export function browserTimeZone(){
  try{return Intl.DateTimeFormat().resolvedOptions().timeZone||DEFAULT_TIMEZONE}catch{return DEFAULT_TIMEZONE}
}
