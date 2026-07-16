import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DREADSTACHE: Games / Film Portfolio",
  description: "Present game and film development models in a customizable cinematic lighting studio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
