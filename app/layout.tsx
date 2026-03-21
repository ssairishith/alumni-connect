import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni Chatspace",
  description: "Connect students, alumni, and faculty in one collaborative space",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
