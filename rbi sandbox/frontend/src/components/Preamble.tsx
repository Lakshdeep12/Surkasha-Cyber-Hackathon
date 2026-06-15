import { useState, useEffect } from 'react';
import slide1 from '../assets/img/Slide-01.png';
import slide2 from '../assets/img/Slide-02.png';
import slide3 from '../assets/img/Slide-03.png';

const slides = [slide1, slide2, slide3];

export default function Preamble() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="w-full bg-[#e6e6e6] flex flex-col items-center">
      {/* Preamble container: 1320px centered */}
      <div className="w-[1320px] h-[170px] bg-[#cf8a2b] flex items-stretch overflow-hidden relative">

        {/* Left Panel: Slideshow Area (35% width) */}
        <div className="relative w-[35%] h-full flex-shrink-0 flex items-center justify-center bg-[#cf8a2b]">
          {slides.map((slide, index) => (
            <img
              key={index}
              src={slide}
              alt={`Slide ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            />
          ))}

          {/* Play / Pause controls - subtle overlay */}
          <div className="absolute bottom-2 left-2 flex gap-1 z-10 opacity-70 hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              aria-label="Play slideshow"
              className="w-4 h-4 flex items-center justify-center bg-black/40 text-white text-[8px] hover:bg-black/60 transition-colors"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(true)}
              aria-label="Pause slideshow"
              className="w-4 h-4 flex items-center justify-center bg-black/40 text-white text-[8px] hover:bg-black/60 transition-colors"
            >
              ❚❚
            </button>
          </div>
        </div>

        {/* Right Panel: Content Area (65% width) */}
        <div className="w-[65%] h-full flex flex-col justify-center px-8 text-black bg-[#cf8a2b] select-none">
          <h2 className="text-[28px] font-bold tracking-normal uppercase text-black leading-none mb-1.5" style={{ fontFamily: 'Arial, sans-serif' }}>
            PREAMBLE
          </h2>

          <p className="text-[16px] leading-[1.5] text-black text-justify font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
            “To regulate the issue of Bank notes and keeping of reserves with a view to securing monetary stability in India and generally to operate the currency and credit system of the country to its advantage; to have a modern monetary policy framework to meet the challenge of an increasingly complex economy, to maintain price stability while keeping in mind the objective of growth.”
          </p>
        </div>
      </div>

      {/* Bottom Blue Strip: 1320px centered */}
      <div className="w-[1320px] h-[36px] bg-gradient-to-r from-[#184680] to-[#0c274c] border-b-[2px] border-[#081d39]"></div>
    </div>
  );
}