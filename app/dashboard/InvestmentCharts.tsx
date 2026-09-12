'use client';

type Item={name:string;value:number};
const COLORS=['#315f9d','#7b61ff','#d79d35','#2f8f62','#cf5f6f','#4a7a8c','#9b6fae'];
const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));

export default function InvestmentCharts({etfItems,portfolioItems}:{etfItems:Item[];portfolioItems:Item[]}){
 return <section className="grid2 gap-top"><AllocationChart title="Komposisi ticker ETF" kicker="ETF Allocation" items={etfItems}/><AllocationChart title="ETF vs Emas vs Dividen" kicker="Portfolio Allocation" items={portfolioItems}/></section>
}

export function AllocationChart({title,kicker,items,compact=false}:{title:string;kicker:string;items:Item[];compact?:boolean}){
 const rows=items.filter(x=>x.value>0),total=rows.reduce((s,x)=>s+x.value,0);
 if(!total)return <div className={compact?'allocation-compact card pad':'card pad'}><div className="kicker">{kicker}</div><h2>{title}</h2><p className="empty">Belum ada nilai portofolio untuk ditampilkan.</p></div>;
 let at=0;
 const slices=rows.map((x,i)=>{const start=at,p=x.value/total*100;at+=p;return`${COLORS[i%COLORS.length]} ${start}% ${at}%`});
 return <div className={compact?'allocation-compact card pad':'card pad'}><div className="kicker">{kicker}</div><h2>{title}</h2><div className="portfolio-donut-wrap"><div className="portfolio-donut" style={{background:`conic-gradient(${slices.join(',')})`}}><div className="portfolio-donut-hole"><b>{rp(total)}</b><span>Total investasi</span></div></div><div className="portfolio-legend">{rows.map((x,i)=><div key={x.name}><span className="portfolio-dot" style={{background:COLORS[i%COLORS.length]}}/><div><b>{x.name}</b><small>{(x.value/total*100).toFixed(1)}% · {rp(x.value)}</small></div></div>)}</div></div></div>
}
