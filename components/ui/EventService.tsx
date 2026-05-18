"use client";

// import { useState, useEffect, useRef } from "react";


interface IEventService {
    name: string;
    event: string;
    // children?: React.ReactNode;
}

const bgMap: Record<string, string> = {
  family: "bg-[url('/images/services/family.png')]",
  couple: "bg-[url('/images/services/couple.png')]",
  corporate: "bg-[url('/images/services/corporate.png')]",
};

const EventService = ({ name , event } : IEventService) => {

    const bgClass = bgMap[name] || "bg-gray-200";
    
    return (
        <div
            className={`group flex justify-center items-center w-full h-48 lg:h-64 lg:h-[500px] ${bgClass} bg-no-repeat bg-cover bg-center rounded `}
        >
            <h3 
                className="relative z-10 text-lg lg:text-4xl text-white font-bold text-center px-4 lg:opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
            >
                {event}
            </h3>
        </div>
    );
}

export default EventService;

