import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FFPMU Angola | Gestão da Igreja",
  description: "Sistema Integrado de Gestão da Igreja",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-AO"><body>{children}</body></html>;
}
