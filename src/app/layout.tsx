import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";


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
      <ClerkProvider dynamic>
        <ConvexClientProvider>
          <body>{children}</body>
        </ConvexClientProvider>
      </ClerkProvider>
    </html>
  );
}
