import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Plateforme Multi-Agent", description: "Dashboard des agents marketing" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-creme text-nuit min-h-screen">
        <header className="bg-nuit text-creme">
          <nav className="max-w-6xl mx-auto flex items-center gap-6 px-6 py-4">
            <Link href="/" className="font-bold tracking-widest text-sm">
              MULTI‑AGENT <span className="text-accent">●</span>
            </Link>
            <Link href="/" className="text-sm opacity-80 hover:opacity-100">Agents</Link>
            <Link href="/chat" className="text-sm opacity-80 hover:opacity-100">Chat</Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
