import type { Metadata } from "next";
import { NavBar } from "@/components/Layout/NavBar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jogos Bíblicos - Plataforma",
  description: "Divirta-se e aprenda com jogos cristãos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans bg-slate-950 text-white min-h-screen flex flex-col">
        <AuthProvider>
          <NavBar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
