import type { ReactNode } from "react";
export const metadata = { title: "ZARIKS PartnerNet", description: "Independent beverage operations workspace" };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="en"><body style={{margin:0,fontFamily:"Arial, sans-serif",background:"#f7f8f4",color:"#173e30"}}>{children}</body></html>; }
