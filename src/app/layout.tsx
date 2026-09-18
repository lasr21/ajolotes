import type { Metadata, Viewport } from "next";
import { Fredoka, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Ajolotes en Producción",
  description:
    "Tu ajolote contra los bugs de JavaScript. 20 segundos y un code review sarcástico.",
};

export const viewport: Viewport = {
  themeColor: "#0E4A55",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${fredoka.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-agua text-lirio font-sans">
        {children}
      </body>
    </html>
  );
}
