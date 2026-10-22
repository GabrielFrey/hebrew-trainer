import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";


const hebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-he",
  display: "swap",
});

const reading = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-read",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Biti Ivrit",
  description: "Modern Hebrew from the first letter to everyday Israeli life.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${hebrew.variable} ${reading.variable} h-full`}>
      <body className="min-h-full bg-sand text-ink antialiased">{children}</body>
    </html>
  );
}
