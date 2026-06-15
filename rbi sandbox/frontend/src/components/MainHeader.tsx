import logoImg from '../assets/img/Site_Logo.png';
import azadiImg from '../assets/img/BBBP_Logo_4.png';

export default function MainHeader() {
  return (
    <header className="bg-white w-full h-[125px] flex items-center select-none">
      <div className="max-w-[1320px] w-full mx-auto px-4 flex justify-between items-center h-full">
        {/* Left Side: Logo & Bilingual Text */}
        <div className="flex items-center gap-3">
          <div className="w-[85px] h-[85px] flex-shrink-0 flex items-center justify-center">
            <img src={logoImg} alt="RBI Logo" className="object-contain w-full h-full" />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <h1 className="text-[20px] font-bold text-[#1a1a1a] m-0 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              डेमो रेगुलेटरी बैंक ऑफ इंडिया
            </h1>
            <h2 className="text-[22px] font-bold text-[#1a1a1a] m-0 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Demo Regulatory Bank of India
            </h2>
            <p className="text-gray-500 text-[11px] font-medium tracking-[0.18em] uppercase m-0 mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
              A demo banking system not for deployment purpose!
            </p>
          </div>
        </div>

        {/* Right Side: Mascot Logo */}
        <div className="w-[85px] h-[85px] flex-shrink-0 flex items-center justify-center">
          <img src={azadiImg} alt="Mascot Logo" className="object-contain w-full h-full" />
        </div>
      </div>
    </header>
  );
}