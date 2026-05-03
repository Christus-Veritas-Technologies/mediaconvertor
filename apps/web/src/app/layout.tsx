import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediaConvertor",
  description: "MediaConvertor",
  other: {
    "google-adsense-account": "ca-pub-6071419245494198",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6071419245494198"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <Providers>
          <div className="grid h-svh grid-rows-[auto_1fr]">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
