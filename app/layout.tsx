import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorveteria Doce Sabor - Delivery & Cardápio",
  description: "Sorveteria Doce Sabor — sorvetes artesanais, lanches e bebidas com muito sabor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-neutral-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
