"use client";

import { useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Image from "next/image";

const services = [
  {
    title: "VIDEOGRAPHY",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "PHOTOGRAPHY",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "EVENT COVERAGE",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "PORTRAIT",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "PRE-WEDDING AND ENGAGEMENT SHOOT",
    image:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "EDITING",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop",
  },
];

const Services = () => {
  const [selectedService, setSelectedService] = useState<{
    title: string;
    image: string;
  } | null>(null);

  return (
    <div
      id="services"
      className="services flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 md:p-24 bg-gray-50 w-full h-full"
    >
      <SectionHeading title="Services" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 lg:px-24">
        {services.map((service, index) => (
          <button
            key={index}
            onClick={() => setSelectedService(service)}
            className="group relative overflow-hidden rounded-3xl shadow-xl h-[350px] hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <Image
              src={service.image}
              alt={service.title}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-50"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <h2 className="text-white text-2xl font-extrabold tracking-wide leading-tight drop-shadow-lg">
                {service.title}
              </h2>

              <p className="text-gray-200 mt-2 text-sm opacity-0 group-hover:opacity-100 transition-all duration-500">
                Professional and cinematic quality service for unforgettable
                moments.
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setSelectedService(null)}
            className="absolute top-6 right-6 bg-white text-black w-12 h-12 rounded-full text-2xl font-bold shadow-xl hover:bg-red-600 hover:text-white transition-all duration-300 z-50"
          >
            ✕
          </button>

          <div className="relative w-full max-w-6xl animate-zoomIn">
            <div className="relative w-full h-[80vh] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={selectedService.image}
                alt={selectedService.title}
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <h1 className="text-white text-4xl md:text-6xl font-black leading-tight drop-shadow-2xl">
                  {selectedService.title}
                </h1>

                <p className="text-gray-200 mt-4 max-w-2xl text-lg md:text-xl">
                  High-quality creative visuals with professional editing,
                  storytelling, and cinematic production.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      <style jsx>{`
        .marquee {
          width: max-content;
          animation: marquee 18s linear infinite;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-zoomIn {
          animation: zoomIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Services;
