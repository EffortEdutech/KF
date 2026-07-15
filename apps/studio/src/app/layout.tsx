import type { Metadata } from "next";
import "./globals.css";
import { StudioShell } from "./studio-shell";

export const metadata: Metadata = {
  title: "Knowledge Factory Studio",
  description: "Professional knowledge manufacturing workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}
