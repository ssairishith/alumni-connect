import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni Connect",
  description: "Connect students, alumni, and faculty of Anurag University.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}


