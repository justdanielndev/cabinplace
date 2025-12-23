import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IntercomWrapper } from "@/components/intercom-wrapper";
import { BanCheckProvider } from "@/components/ban-check-provider";
import { AuthSyncProvider } from "@/components/auth-sync-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Midnight Cabin",
  description: "Midnight Cabin hackathon panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <IntercomWrapper>
          <AuthSyncProvider>
            <BanCheckProvider>
              {children}
            </BanCheckProvider>
          </AuthSyncProvider>
        </IntercomWrapper>
      </body>
    </html>
  );
}
