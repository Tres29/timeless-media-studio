const Corousel = () => {
    const items = [
        "Photography", "Birthday Events", "Weddings", 
        "Debuts", "Concerts", "Family Shoot", 
        "Prenup", "Travel Photography"
    ];

    // Pinagsasama natin ang array sa isang string na may separator
    const scrollingText = items.join(" • ") + " • ";

    return (
        <> 
            <div className="w-full">
                <div className="w-full overflow-hidden bg-gradient-to-br from-white via-[#D9D9D9] to-[#B0B0B0] py-4 rounded text-2xl text-shadow-lg text-shadow-gray-800 relative">
                    <div className="marquee flex whitespace-nowrap ">
                    {/* Render natin ng dalawang beses para sa seamless loop */}
                        <span className="text-white font-semibold px-2">
                            {scrollingText} {scrollingText}
                        </span>
                        <span className="text-white  font-semibold px-2">
                            {scrollingText} {scrollingText}
                        </span>
                    </div>
                </div>
            </div>
        
            <style jsx>{`
                .marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 20s linear infinite;
                }

                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        /* Lilipat tayo sa kalahati para pagbalik sa 0, hindi halata */
                        transform: translateX(-50%);
                    }
                }

                /* Optional: Mas maganda tingnan kung hihinto pag ni-hover */
                .marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </>
    );
};

export default Corousel;