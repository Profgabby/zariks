"use client";
import { useMemo, useState } from "react";
type Order = { id: string; outlet: string; sku: string; bottles: number; status: string };
const initial: Order[] = [
  {id:"S-001",outlet:"Kano Central",sku:"Classic Hibiscus 500 mL",bottles:240,status:"Pending"},
  {id:"S-002",outlet:"Dutse",sku:"Classic Hibiscus 250 mL",bottles:120,status:"Packed"}
];
const sections = ["Overview","Orders","Products","Production","Inventory","Partners","Quality","Deliveries","Finance","Settings"] as const;
type Section = typeof sections[number];
const sample = [{name:"Classic Hibiscus",format:"500 mL PET",sku:"ZRK-500"},{name:"Classic Hibiscus",format:"250 mL Pouch",sku:"ZRK-250"},{name:"Classic Hibiscus",format:"50 mL Sachet",sku:"ZRK-050"}];
export default function Page(){
 const [section,setSection]=useState<Section>("Overview");
 const [orders,setOrders]=useState<Order[]>(initial);
 const [outlet,setOutlet]=useState("");const [bottles,setBottles]=useState("100");
 const total=useMemo(()=>orders.reduce((s,o)=>s+o.bottles,0),[orders]);
 const btn=(label:string,action:()=>void)=> <button onClick={action} style={{background:"#006b3c",color:"white",border:0,padding:"11px 17px",borderRadius:9,cursor:"pointer"}}>{label}</button>;
 const card=(label:string,value:string)=> <div style={{background:"white",padding:22,borderRadius:14,boxShadow:"0 3px 14px #002b1510"}}><div style={{fontSize:13,color:"#547063"}}>{label}</div><strong style={{fontSize:27}}>{value}</strong></div>;
 return <div style={{display:"flex",minHeight:"100vh",flexWrap:"wrap"}}>
 <aside style={{background:"#004d2b",color:"white",width:235,padding:24,boxSizing:"border-box",flexGrow:0}}>
 <div style={{fontWeight:900,fontSize:29,letterSpacing:1}}>ZARIKS<span style={{color:"#f3bf39"}}>.</span></div><div style={{fontSize:13,marginBottom:30}}>PartnerNet</div>
 {sections.map(s=><button key={s} onClick={()=>setSection(s)} aria-current={section===s?"page":undefined} style={{display:"block",width:"100%",textAlign:"left",padding:"13px 12px",marginBottom:5,border:0,borderRadius:8,background:section===s?"#f0bb3c":"transparent",color:section===s?"#143b2b":"white",fontWeight:section===s?700:400,cursor:"pointer"}}>{s}</button>)}
 </aside>
 <main style={{padding:"32px clamp(16px,4vw,54px)",flex:"1 1 650px",minWidth:0}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><small style={{color:"#647a6e"}}>ZARIKS / PartnerNet</small><h1 style={{margin:"7px 0 0"}}>{section}</h1></div><span style={{fontSize:12,background:"#fff0c8",padding:"9px 12px",borderRadius:30}}>Local sample data · No live connection</span></div>
 {section==="Overview"?<><p>Independent operational workspace. Existing finance application is not connected.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16,marginTop:25}}>{card("Sample orders",String(orders.length))}{card("Sample bottles",total.toLocaleString())}{card("Product formats",String(sample.length))}{card("Database status","Offline")}</div><div style={{marginTop:25,background:"white",padding:25,borderRadius:14}}><h2>Operations overview</h2><p>Use the navigation to review sample orders, product formats, and the future module boundaries. This application does not modify any existing ZARIKS records.</p>{btn("View orders",()=>setSection("Orders"))}</div></>:
 section==="Orders"?<><p>Manage sample orders in this browser session only.</p><form onSubmit={e=>{e.preventDefault();const n=Number(bottles);if(!outlet.trim()||!Number.isInteger(n)||n<=0)return;setOrders(o=>[...o,{id:"S-"+String(o.length+1).padStart(3,"0"),outlet:outlet.trim(),sku:sample[0].name+" 500 mL",bottles:n,status:"Pending"}]);setOutlet("");}} style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}><input aria-label="Outlet" required placeholder="Outlet" value={outlet} onChange={e=>setOutlet(e.target.value)} style={{padding:11}}/><input aria-label="Bottle quantity" required type="number" min="1" step="1" value={bottles} onChange={e=>setBottles(e.target.value)} style={{padding:11,width:130}}/><button type="submit" style={{padding:"11px 18px",background:"#006b3c",color:"white",border:0,borderRadius:8}}>Add sample order</button></form><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",background:"white"}}><thead><tr>{["ID","Outlet","Product","Bottles","Status"].map(x=><th key={x} style={{textAlign:"left",padding:14,borderBottom:"1px solid #ddd"}}>{x}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o.id}>{[o.id,o.outlet,o.sku,String(o.bottles),o.status].map((v,i)=><td key={i} style={{padding:14,borderBottom:"1px solid #eee"}}>{v}</td>)}</tr>)}</tbody></table></div></>:
 section==="Products"?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginTop:22}}>{sample.map(p=><div key={p.sku} style={{padding:25,background:"white",borderRadius:14}}><h2>{p.name}</h2><p>{p.format}</p><small>{p.sku} · sample catalog</small></div>)}</div>:
 <div style={{background:"white",padding:30,borderRadius:14,marginTop:25}}><h2>{section} workspace</h2><p>This module is isolated and awaiting an approved data contract. No live finance or operational tables are accessed.</p><p>Integration will require explicit permissions, a reviewed schema, and tested role-based access.</p>{btn("Return to overview",()=>setSection("Overview"))}</div>}
 </main></div>;
}
