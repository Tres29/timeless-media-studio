import { useState, useEffect, useRef } from "react";

export const useHeaderVisibility = () => {
    const [headerVisibility, setHeaderVisibility] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const updateHeaderVisibility = () => {
            const currentScrollY = window.scrollY;

            // console.log(`Current: ${currentScrollY} and Last: ${lastScrollY.current}}`);

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setHeaderVisibility(false);
                setMenuOpen(false);
            } else {
                setHeaderVisibility(true);
            }

            lastScrollY.current = currentScrollY;

            ticking.current = false;
        }

        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(updateHeaderVisibility);
                ticking.current = true;
            }        
        };

        window.addEventListener("scroll", handleScroll);
        return  () => window.removeEventListener("scroll", handleScroll);

    }, [])

    return { headerVisibility, menuOpen, setMenuOpen };
}