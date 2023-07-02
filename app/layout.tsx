import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Fauna Playground - Easily run FQL +v.10 queries",
  description:
    "Unleash the power of FQL +v.10 queries with Fauna Playground: easily run and optimize your queries",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
