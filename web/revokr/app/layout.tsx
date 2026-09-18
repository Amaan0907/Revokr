import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { GlassLight } from "@/components/motion/glass-light";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Revokr · Leaked secrets, rotated safely", template: "%s · Revokr" },
  description:
    "Detects leaked secrets in your repositories and rotates them safely, with a human in the loop.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-dvh font-sans">
        <MotionProvider>{children}</MotionProvider>
        <GlassLight />
        <SmoothScroll />
      </body>
    </html>
  );
}
