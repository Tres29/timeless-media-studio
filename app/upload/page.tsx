"use client"
import { useState } from "react";

import { MdOutlineUpload } from "react-icons/md";
import { BiPhotoAlbum } from "react-icons/bi";


const Upload = () => {
    const [isDisplay, setIsDisplay] = useState(false);
    return (
        <div className="flex flex-col justify-center  items-center px-4 py-8 w-full min-h-screen">
            <div
                className="bg-[url(/images/gallery/wedding.png)] flex flex-col justify-end items-start px-4 pb-8 mb-4 h-96 w-full max-w-sm bg-no-repeat bg-fit bg-center rounded-md shadow-lg shadow-black/40"
            >
                <h3 className="text-xl text-white font-bold tracking-wide">Timeless Media Studio</h3>
                <span className="text-sm text-gray-300">May 17 2026</span>
            </div>

            {/** BUTTONS and MENU Container */}
            <div className="flex flex-col justify-center gap-4 w-full max-w-sm">


                <div className="relative h-full w-full bg-red-100">
                    {/* { isDisplay && 
                    <div className="absolute top-92 left-16 flex flex-col  justify-between py-1  h-fit w-64 bg-gradient-to-b from-[#303030]/90 via-20% via-[#1A1A1A] to-[#303030]/90 via-20% hover:bg-[#1A1A1A] rounded-md text-start text-[#E8E8E8]">
                        <div className="p-2"> Photo Library</div>
                        <div className="p-2 border-t border-b border-white/20 py-2">Take Photo or Video</div>
                        <div className="p-2">Choose Files</div>
                    </div>} */}
                    <button
                        onClick={() => setIsDisplay(!isDisplay) }
                        className="flex justify-center items-center gap-2 w-full py-3 bg-gradient-to-b from-[#303030]/90 via-20% via-[#1A1A1A] to-[#303030]/90 via-20% hover:from-[#404040] hover:to-[#222]  text-white text-md border border-white/40 rounded-md"
                    >
                        <span className=""><MdOutlineUpload size="22" /></span> 
                        <span className="tracking-widest font-medium">Upload Media</span>
                    </button>

                    <div
                        className={
                            `absolute bottom-full left-0 flex-col justify-between py-1 mb-2  w-full h-fit  bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border
                            border-white/10 rounded-xl text-start text-[#E8E8E8] shadow-2xl backdrop-blur-md transition-all duration-300 origin-bottom
                            ${isDisplay  ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95' }
                        `}
                    >
                        <button
                            className="p-3 w-full text-sm hover:bg-white/5 text-left rounded-t-xl transition-colors "
                        >
                            Photo Library
                        </button>
                        <button
                            className="p-3 py-3 w-full text-sm border-t border-b  border-white/15 hover:bg-white/5 text-left transition-colors "
                        >
                            Take photo or Video
                        </button>
                        <button
                            className="p-3 text-sm w-full hover:bg-white/5 text-left rounded-b-xl transition-colors"
                        >
                            Choose File
                        </button>
                    </div>
                    
                </div>
                
                <button
                    onClick={() => alert("Album")}
                    className="flex justify-center items-center gap-2 w-full py-3 bg-gradient-to-b from-[#303030]/90 via-20% via-[#1A1A1A] to-[#303030]/90 via-20% text-white text-md border border-white/40 rounded-md"
                >
                    <span className=""><BiPhotoAlbum /></span> 
                    <span className="tracking-widest">View Album</span>
                </button>
            </div>
        </div>
    )
}

export default Upload;
