import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      setTimeStr(`${time} ${date}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[38px] bg-[#ececec] border-b border-gray-300 flex items-center font-sans">
      <div className="w-[1320px] mx-auto px-4 flex justify-between items-center text-[12px] text-gray-700">
        {/* Left Side: Skip Link & Date-Time */}
        <div className="flex items-center gap-2">
          <a href="#" className="underline text-blue-800 hover:text-blue-900 font-medium">
            Skip to main content
          </a>
          <span className="text-gray-400">|</span>
          <span className="font-normal text-gray-800">{timeStr}</span>
          <span className="text-gray-400">|</span>
          <Link to="/admin" className="text-blue-800 hover:text-blue-900 font-semibold flex items-center gap-1">
            Admin Portal
          </Link>
        </div>

        {/* Right Side: Accessibility & Language controls */}
        <div className="flex items-center gap-4">
          {/* T, A+, A, A- group */}
          <div className="flex items-center border border-gray-400 rounded-sm bg-white overflow-hidden h-[22px]">
            <button className="px-1.5 h-full text-[10px] font-bold text-gray-700 bg-[#dfdfdf] border-r border-gray-300 hover:bg-gray-300 flex items-center justify-center">
              T
            </button>
            <button className="px-1.5 h-full text-[10px] font-bold text-gray-700 bg-[#dfdfdf] border-r border-gray-300 hover:bg-gray-300 flex items-center justify-center">
              A+
            </button>
            <button className="px-1.5 h-full text-[10px] font-bold text-gray-700 bg-[#dfdfdf] border-r border-gray-300 hover:bg-gray-300 flex items-center justify-center">
              A
            </button>
            <button className="px-1.5 h-full text-[10px] font-bold text-gray-700 bg-[#dfdfdf] hover:bg-gray-300 flex items-center justify-center">
              A-
            </button>
          </div>

          {/* Contrast boxes */}
          <div className="flex items-center gap-1 h-[22px]">
            <button className="w-[18px] h-[18px] bg-black text-white text-[10px] font-bold flex items-center justify-center border border-black hover:opacity-80" aria-label="Dark Contrast">
              A
            </button>
            <button className="w-[18px] h-[18px] bg-white text-black text-[10px] font-bold flex items-center justify-center border border-gray-400 hover:bg-gray-100" aria-label="Light Contrast">
              A
            </button>
            <button className="w-[18px] h-[18px] bg-[#888888] text-white text-[10px] font-bold flex items-center justify-center border border-[#888888] hover:opacity-80" aria-label="Gray Contrast">
              A
            </button>
          </div>

          {/* Separator / Print Icon */}
          <button className="flex items-center justify-center p-0.5 border border-gray-300 hover:bg-gray-200 rounded-sm" aria-label="Print Page" onClick={() => window.print()}>
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>

          {/* Language selection */}
          <div className="flex items-center gap-2 text-[12px] font-sans text-gray-800">
            <a href="#" className="hover:underline">Change Language</a>
            <a href="#" className="hover:underline font-bold text-blue-900">हिंदी</a>
          </div>
        </div>
      </div>
    </div>
  );
}