"use client";

import HeroSection from "@/sections/hero-section/HeroSection";
import AboutSection from "@/sections/about-section/AboutSection";
import Services from "@/sections/services/Services";
import Corousel from "@/sections/corousel/Corousel";
import Gallery from "@/sections/galleries/Gallery";


export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen overflow-x-hidden">
      <HeroSection />
      <AboutSection />
      <Services />
      <Corousel />
      <Gallery />
    </div>
  );
}
 