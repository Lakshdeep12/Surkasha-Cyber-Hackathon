import { useState } from 'react';

interface LanguageModalProps {
  onClose: () => void;
}

export default function LanguageModal({ onClose }: LanguageModalProps) {
  const [remember, setRemember] = useState(false);

  const handleSelect = (lang: string) => {
    if (remember) {
      localStorage.setItem('preferredLanguage', lang);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white max-w-lg w-full shadow-elevated rounded-2xl p-8 border-t-4 border-drbi-blue animate-slide-up">
        <div className="text-center mb-8">
          <p className="text-lg font-bold text-drbi-navy mb-2 leading-snug">
            डेमो रेगुलेटरी बैंक ऑफ़ इंडिया की आधिकारिक वेबसाइट में आपका स्वागत है
          </p>
          <p className="text-base text-gray-600 font-medium">
            Welcome to official website of Demo Regulatory Bank of India
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-drbi-dark mb-1">
            वेबसाइट देखने के लिए अपनी पसंदीदा भाषा का चयन करें
          </p>
          <p className="text-xs text-gray-500">
            Select your Preferred Language to Access the Website
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => handleSelect('en')}
            className="btn btn-primary px-8"
          >
            English
          </button>
          <button
            onClick={() => handleSelect('hi')}
            className="btn btn-primary px-8"
          >
            Hindi
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-4 border-t border-drbi-border">
          <input
            type="checkbox"
            id="rememberChoice"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 text-drbi-blue border-gray-300 rounded focus:ring-drbi-blue cursor-pointer"
          />
          <label htmlFor="rememberChoice" className="text-sm text-gray-600 cursor-pointer select-none">
            मेरा चयनित विकल्प याद रखें / Remember my choice
          </label>
        </div>
      </div>
    </div>
  );
}