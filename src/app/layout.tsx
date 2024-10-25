import type { Metadata } from "next";
import "./globals.css";

import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "Chatstarter",
  description: "Let's chat!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ConvexClientProvider>
        <body>{children}</body>
      </ConvexClientProvider>
    </html>
  );
}
