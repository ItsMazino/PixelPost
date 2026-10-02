import type { Metadata } from "next";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/caveat/400.css";
import "@fontsource/bebas-neue/400.css";
import "./globals.css";
import "./studio.css";
export const metadata: Metadata = {
  title: "PixelPost — A little piece of somewhere",
  description:
    "A playful, private postcard studio with photos, stickers, handwritten notes and beautiful PNG exports.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
