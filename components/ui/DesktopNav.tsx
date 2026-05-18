"use client";


import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { MdOutlineMonochromePhotos } from "react-icons/md";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Services", href: "/#services" },
    { name: "Gallery", href: "/#gallery" },
    { name: "Tracking Order", href: "/api" },
];

const DesktopNav = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
    const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-black text-white transition-transform duration-500 ease-in-out ${
        headerVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
        <div 
            className="flex items-center justify-between px-4 py-4 sm:px-8"
        >
            <div className="text-2xl sm:text-4xl font-bold">
                <MdOutlineMonochromePhotos size="60" />
            </div>

            <div className="flex justify-between gap-8 w-1/2">
                {navLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    className="px-8 py-2 border border-white rounded text-xl inset-0 shadow-md shadow-gray-100 text-shadow-md text-shadow-sky-300"
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