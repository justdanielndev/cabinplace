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
  title: process.env.NEXT_PUBLIC_APP_NAME || "Cabinplace",
  description: "Hackathon dashboard for attendees and staff",
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON_PATH || "/favicon.ico",
  },
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
