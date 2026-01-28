import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Strong Motion Data Viewer",
  description: "Strong motion earthquake data from CESMD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${merriweather.variable} ${sourceSans.variable} antialiased`}
      >
        <div className="h-screen flex flex-col">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
