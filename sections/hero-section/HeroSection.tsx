"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import QR from "@/sections/hero-section/QR";

const words = [
  'Moment', 'Memory', 'Story', 'Dream', 'Magic', 
  'Light', 'Frame', 'Essence', 'Beauty', 'Art', 
  'Vision', 'Soul'
];

const WordAnimation = ({ word }: { word: string }) => {
  return (
    <span className="relative inline-block overflow-hidden h-[1.1em] align-bottom min-w-[200px] w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={word}
          initial={{ opacity: 0, y: 20 }}    
          animate={{ opacity: 1, y: -10 }}     
          exit={{ opacity: 0, y: -20 }}      
          transition={{ 
            duration: 1.5,       
            ease: [0.4, 0, 0.2, 1]          // Bezier  premium feel
          }}
          className="text-[#A3A3A3] absolute left-0"
        >
          {word}
        </motion.div>
      </AnimatePresence>
    </span>
  );
};

const HeroSection = () => {
  const [randomWord, setRandomWord] = useState(words[0]);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setRandomWord((prev) => {
        const remainingWords = words.filter(w => w !== prev);
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        return remainingWords[randomIndex];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleBookNow = () => {
    router.push('/contact');
  };

  return (
    <div className="hero-section w-full bg-black text-white relative min-h-screen flex items-center">
      
      <div className="flex flex-col gap-8 px-6 sm:px-12 lg:px-24 w-full max-w-7xl">
        
        <div className="test text-6xl sm:text-7xl lg:text-9xl font-bold leading-[1.1] tracking-tight dm-serif">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            Create
          </motion.div> 
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Every
          </motion.div> 
          
          <WordAnimation word={randomWord} />
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          onClick={handleBookNow}
          className="px-8 py-4  w-48 border border-white rounded hover:bg-white hover:text-black transition-all duration-500 text-md lg:text-lg font-bold shadow-lg shadow-gray-500"
        >
          Book Now
        </motion.button>
      </div>
      <div className="hidden relative lg:flex items-center p-16 mr-72 w-1/2 h-screen">
        <QR />
      </div>
    </div>
  );
}

export default HeroSection;