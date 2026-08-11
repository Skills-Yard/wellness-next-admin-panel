import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { CatalogueProvider } from "../contexts/CatalogueContext";
import { AuthProvider } from "../contexts/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { ToastContainer } from "react-toastify";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eezit - Eezit Admin Panel",
  description: "Eezit Admin Panel Catalogue & Services Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased overflow-hidden`}
    >
      <body className="h-full bg-[#FAF9F6] overflow-hidden">
        <AuthProvider>
          <CatalogueProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </CatalogueProvider>
        </AuthProvider>
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      </body>
    </html>
  );
}
