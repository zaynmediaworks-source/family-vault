import {supabase} from '@/lib/supabase';

type R=Record<string,any>;
export type Activity={id:string;created_at:string;created_by:string|null;kind:string;title:string;detail:string};
const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));

export async function loadActivity(householdId:string){
 const defs=[['income','Income'],['expenses','Expense'],['budgets','Budget'],['obligations','Kewajiban'],['etf_assets','ETF'],['gold_assets','Emas'],['dividend_stocks','Saham Dividen'],['savings','Tabungan'],['debts','Hutang'],['wishlists','Wishlist']] as const;
 const results=await Promise.all(defs.map(([table])=>supabase.from(table).select('*').eq('household_id',householdId).order('created_at',{ascending:false}).limit(30)));
 const rows:Activity[]=[];
 results.forEach((r,i)=>{const [table,label]=defs[i];for(const x of (r.data||[]) as R[]){rows.push({id:`${table}-${x.id}`,created_at:x.created_at,created_by:x.created_by||null,kind:label,title:x.name||x.source||x.category||x.ticker||label,detail:x.amount!=null?money(x.amount):x.original_amount!=null?money(x.original_amount):x.target!=null?`Target ${money(x.target)}`:''})}});
 rows.sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
 return rows.slice(0,100);
}
