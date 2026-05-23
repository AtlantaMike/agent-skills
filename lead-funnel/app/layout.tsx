import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getNicheConfig } from "@/config";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const config = getNicheConfig();
  return {
    title: `Apply | ${config.tagline}`,
    description: config.heroSubheadline,
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getNicheConfig();
  return (
    <html lang="en" data-niche={config.slug}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
