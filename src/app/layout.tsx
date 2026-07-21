import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { CatalogueProvider } from "../contexts/CatalogueContext";
import MainLayout from "../components/layout/MainLayout";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vellora - Wellness Admin Panel",
  description: "Wellness Admin Panel Catalogue & Services Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-hidden`}
    >
      <body className="h-full bg-[#FAF9F6] overflow-hidden">
        <CatalogueProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </CatalogueProvider>
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      </body>
    </html>
  );
}
