import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LightRays from "@/components/LightRays";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted_grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian_mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for every Dev Event you Musn't Miss",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        schibstedGrotesk.variable,
        martianMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
          <LightRays
            raysOrigin="top-center"
            raysColor="#5dfeca"
            raysSpeed={0.5}
            lightSpread={0.9}
            rayLength={1.4}
            glow={0.6}
            haze={0.25}
            followMouse
            mouseInfluence={0.02}
            rayDensity={1}
            tilt={0}
            raySharpness={0.35}
            atmosphere={1}
            intensity={1}
            fadeDistance={1}
            saturation={1}
            noiseAmount={0}
            distortion={0}
            pulsating={false}
            cursorShadow
            clickPulse
            intro
            lightMode={false}
          />
        </div>
        <main>{children}</main>
      </body>
    </html>
  );
}
