import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillSync – Career Navigation",
  description: "Career navigation for early-career technical candidates",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-blue-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
