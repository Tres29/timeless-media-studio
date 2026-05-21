import Link from "next/link";

import { MdOutlineMonochromePhotos } from "react-icons/md";

const TimelessLogo = () => {
    return (
        <Link
            href="/" 
            className="text-2xl sm:text-4xl font-bold"
        >
            <MdOutlineMonochromePhotos size="60" />
        </Link>
    )
} 

export default TimelessLogo;