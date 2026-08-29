import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoardWise | Urban Transit Intelligence",
  description: "AI-powered boarding intelligence predicting transit crowd viability before you wait. Built for Hyderabad.",
  keywords: ["Transit", "Hyderabad", "AI", "Smart City", "TGSRTC", "Commuter"],
  icons: {
    // This is the literal SVG path for the Activity (ECG) icon in emerald green
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'></polyline></svg>",
  },
  openGraph: {
    title: "BoardWise | Urban Transit Intelligence",
    description: "Predicting transit crowd viability before you wait. Built for Hyderabad.",
    type: "website",
    locale: "en_IN",
    siteName: "BoardWise",
  },
  twitter: {
    card: "summary_large_image",
    title: "BoardWise | Urban Transit Intelligence",
    description: "Predicting transit crowd viability before you wait.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}