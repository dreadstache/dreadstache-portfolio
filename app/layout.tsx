import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://games.luccote.com"),
  title: "Luc Cote | Games, Film & 3D",
  description: "Games, film, interactive 3D, technical art, and production work by Luc Cote.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Luc Cote | Games, Film & 3D",
    description: "Games, film, interactive 3D, technical art, and production work by Luc Cote.",
    url: "/",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
