import Link from "next/link";
export const metadata = { title: "Workspace Access | ZARIKS" };
export default function Access() {
  return <main style={{maxWidth:760,margin:"70px auto",padding:"30px 25px",lineHeight:1.65}}>
    <Link href="/site/index.html" style={{color:"#006b3c"}}>← ZARIKS website</Link>
    <h1 style={{color:"#006b3c"}}>Workspace access</h1>
    <p>The operations and administration workspaces are reserved for authorized ZARIKS personnel. Access is not yet enabled through this PartnerNet preview.</p>
    <p>Existing ZARIKS identity and permissions must be verified and connected before staff or partners can view protected business records. No credentials should be entered on this page.</p>
    <p><Link href="/partners" style={{color:"#006b3c"}}>Partner information</Link> · <Link href="/site/contact.html" style={{color:"#006b3c"}}>Contact ZARIKS</Link></p>
  </main>;
}
