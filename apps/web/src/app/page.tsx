"use client";

import { Footer } from "@/components/landing/landing-footer";
import { Header } from "@/components/landing/landing-header";
import { Hero } from "@/components/landing/landing-hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between font-sans selection:bg-zinc-900 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <Header />
      <Hero />
      <Footer />
    </div>
  );
}
