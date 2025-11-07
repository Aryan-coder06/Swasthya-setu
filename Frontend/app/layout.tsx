import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClickSpark from "@/components/ui/click-spark";
import LoadingScreen from "@/components/LoadingScreen";
import { ReactToastProvider } from "@/components/providers/react-toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwasthyaSetu - Healthcare Management Platform",
  description: "Modern Doctor-Patient-Hospital Management & Connection Platform",
  icons: {
    icon: "Images/ai.png",
    shortcut: "Images/ai.png",
    apple: "Images/ai.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-screen bg-swasthya-gradient text-foreground antialiased selection:bg-emerald-200/60 selection:text-emerald-900`}
      >
        <ClickSpark />
        {/* <LoadingScreen> */}
          <div className="min-h-screen">
            <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_20%_20%,_rgba(88,237,200,0.25),_transparent_55%),radial-gradient(circle_at_80%_0%,_rgba(132,204,255,0.25),_transparent_60%)]" />
            {children}
            <ReactToastProvider />
          </div>
        {/* </LoadingScreen>  */}
      </body>
    </html>
  );
}
