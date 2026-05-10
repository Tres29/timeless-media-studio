// import Image from "next/image";
"use client";

export default function Home() {
  return (
    <div className="flex flex-col w-screen">
      <nav
        className="nav-header  flex justify-between gap-2 p-8 bg-black w-screen text-white"
      >
        <div className="text-4xl">Timeless Media Studio</div>
        <div 
          className="flex gap-20"
        >
          <a>Home</a>
          <a>About</a>
          <a>Services</a>
          <a>Gallery</a>
          <a>Contact</a>
        </div>
      </nav>
      <div className="hero-section w-screen">
        <div
          className="flex flex-col gap-8 absolute left-24 p-4 w-128 h-fit text-white"
        >
          <p className="text-9xl">
            Create Every Moment
          </p>
          <button
            className="px-8 py-4 w-48 border border-white rounded-lg"
          >
            Book Now
          </button>
        </div>
      </div>
      <div className="about flex justify-between items-center gap-2 p-24 h-fit bg-white">
        <div className="w-1/2">
          <img 
            src="/images/camera-shot.png"
          />
        </div>
        <div className="flex flex-col items-center gap-8 w-1/2">
          <h2 className="text-4xl font-bold">ABOUT US</h2>
          <p>
            We believe that every second holds a story worth keeping. What started as a simple passion for the lens has evolved into a dedicated mission: to freeze time for the moments that matter most.
          </p>
          <p>
            From the quiet, candid smiles to the grandest celebrations of life, our goal is to capture the raw emotion and beauty of your journey. We don't just take pictures; we preserve legacies, one frame at a time.
          </p>
        </div>
      </div>
      <div className="services flex flex-col items-center h-120 ">
        <h2 className="text-4xl font-bold">Services</h2>
        <div className="cards ">
          <div></div>
        </div>
      </div>
      <div className="gallery">
        gallery
      </div>
      <div className="contact">Contact us</div>
      <footer>
        Copyright by Frontdesk Team 2026
      </footer>
    </div>
  );
}
 