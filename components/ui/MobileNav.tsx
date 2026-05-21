"use client";
import Link from "next/link";

import TimelessLogo from "@/components/ui/TimelessLogo";
interface MobileNavProps {
  navLinks: { 
    name: string;
    href: string;
  }[];
  visibility: boolean;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileNav = ({
    navLinks,
    visibility,
    menuOpen,
    setMenuOpen
}: MobileNavProps) => {
  
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

            {/** Hamburger Button */}
            <button
                title="hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-sm border border-blue-white shadow-lg shadow-gray-900"
            >
                <span
                    className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                    menuOpen ? "translate-y-1.5 rotate-45" : ""
                    }`}
                />
                <span
                    className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                    }`}
                />
                <span
                    className={`h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? "-translate-y-1.5 -rotate-45" : "" }`}
                />
            </button>
        </div>


        {/** Dialog Box */}
        <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${ menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0" }`}
        >
            <div 
                className="flex flex-col items-end gap-3 px-4 pb-5 sm:px-8"
            >
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="dm-serif w-full rounded px-4 py-2 text-center text-lg transition duration-300 hover:bg-white hover:text-black active:scale-95 sm:w-60 shadow-sm shadow-gray-500 text-shadow-md text-shadow-sky-300/40 tracking-widest"
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
        </div>    
    </nav>
  );
};

export default MobileNav;