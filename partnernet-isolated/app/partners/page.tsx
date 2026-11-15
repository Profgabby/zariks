import Link from "next/link";
export const metadata = { title: "Partners | ZARIKS" };
export default function Partners() {
 return <main style={{maxWidth:850,margin:"55px auto",padding:"30px 25px",lineHeight:1.7}}>
 <Link href="/site/index.html" style={{color:"#006b3c"}}>← ZARIKS website</Link>
 <h1 style={{color:"#006b3c"}}>ZARIKS Partner Network</h1>
 <p>Our network brings together contract beverage producers, farmers, ingredient and packaging suppliers, distributors, and institutional buyers.</p>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:15}}>
 {["Contract Producers","Farmers & Suppliers","Distribution Partners","Schools & Institutions"].map(name=><div key={name} style={{border:"1px solid #ddd",borderRadius:12,padding:20,background:"white"}}><h2 style={{fontSize:19}}>{name}</h2><p>Learn about participation and partnership opportunities.</p></div>)}
 </section>
 <p><Link href="/site/partners.html" style={{color:"#006b3c"}}>Explore partnerships</Link> · <Link href="/site/contact.html" style={{color:"#006b3c"}}>Contact our team</Link></p>
 <p>Partner account access will be enabled only after identity verification and organization-specific permissions are configured.</p>
 </main>;
}
