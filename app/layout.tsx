import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uganda Health Guide",
  description: "Uganda Health Guide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
