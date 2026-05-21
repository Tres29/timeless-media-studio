"use client";


import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import TimelessLogo from "@/components/ui/TimelessLogo";

interface DesktopNavProps {
  navLinks: {
    name: string;
    href: string;
  }[];
  visibility: boolean;
}


const DesktopNav = ({
  navLinks,
  visibility
}: DesktopNavProps) => {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-black text-white transition-transform duration-500 ease-in-out ${
        visibility ? "translate-y-0" : "-translate-y-full"
      }`}
    >
        <div 
            className="flex items-center justify-between px-4 py-4 sm:px-8"
        >
            <TimelessLogo />

            <div className="flex justify-between gap-8 w-1/2">
                {navLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    className="dm-serif px-8 py-2 rounded text-2xl inset-0 text-shadow-md text-shadow-sky-300/40 white-space-nowrap tracking-widest hover:text-white/40 transition-colors duration-700"
                >
                    {link.name}
                </Link>
                ))}
            </div>
            
        </div>
   
    </nav>
  );
};

export default DesktopNav;