import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://jfcars.leafy-bard-3849.chatgpt.site"),
  title:"JFcars — Used cars, made joyful",
  description:"Find quality used cars with clear details, smart filters and zero pressure.",
  openGraph:{title:"JFcars — Used cars, made joyful",description:"Find quality used cars with clear details, smart filters and zero pressure.",images:["/og.png"]},
  twitter:{card:"summary_large_image",title:"JFcars — Used cars, made joyful",description:"Find quality used cars with clear details, smart filters and zero pressure.",images:["/og.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
