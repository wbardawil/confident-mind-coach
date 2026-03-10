import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

let ClerkProviderSafe: any = ({ children }: { children: ReactNode }) => children;

// Only enable Clerk if a real key exists
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (publishableKey && !publishableKey.includes("...")) {
  try {
    const clerk = require("@clerk/nextjs");
    ClerkProviderSafe = clerk.ClerkProvider;
  } catch {}
}

export const metadata: Metadata = {
  title: "The Confident Mind Coach",
  description:
    "Build, protect, and deploy confidence through structured mental performance coaching.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ClerkProviderSafe>
          {children}
        </ClerkProviderSafe>
      </body>
    </html>
  );
}
