import rssIcon from '../assets/icons/rss-icon.png';
import twitterIcon from '../assets/icons/Twitter_New.png';
import youtubeIcon from '../assets/icons/youtube.png';
import instagramIcon from '../assets/icons/instagram.png';
import facebookIcon from '../assets/icons/Facebook.jpg';
import linkedinIcon from '../assets/icons/LinkedinIcon1.png';

export default function Footer() {
  return (
    <footer className="w-[1320px] mx-auto mt-6 border border-gray-300 bg-white rounded-none shadow-none font-sans select-none">
      {/* Top Footer Section */}
      <div className="bg-gray-50 px-6 py-6 border-b border-gray-300">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">

          {/* More Links */}
          <div className="flex-1">
            <h4 className="text-[#184680] font-bold mb-4 uppercase flex items-center gap-1.5 text-[13px]">
              More <span className="text-orange-600 font-normal">Links :</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5 text-[11px] font-semibold text-gray-700">
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Bank Holidays</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> COVID-19 Measures</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Forms</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> RTI Kehta Hai</a>

              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Banking Glossary</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> E-LMS</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> FSC/MICR Codes</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> DRBIs Vision and Values</a>

              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Citizen's Charter</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Events</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Important Websites</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Right to Information Act</a>

              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Complaints</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> FAQs</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Opportunities@DRBI</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Tenders</a>

              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Contact Us</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> Financial Education</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1"><span className="text-orange-500 font-normal">›</span> DRBI Guidelines</a>
            </div>
          </div>

          {/* Follow DRBI */}
          <div className="w-full md:w-[180px] md:border-l border-gray-300 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
            <h4 className="text-[#184680] font-bold mb-4 uppercase flex items-center gap-1.5 text-[13px]">
              Follow <span className="text-orange-600 font-normal">DRBI</span>
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-y-3.5 text-[11px] font-semibold text-gray-700">
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={rssIcon} alt="RSS" className="w-3.5 h-3.5 object-contain" /> RSS</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={twitterIcon} alt="Twitter" className="w-3.5 h-3.5 object-contain" /> Twitter</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={youtubeIcon} alt="YouTube" className="w-3.5 h-3.5 object-contain" /> YouTube</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={instagramIcon} alt="Instagram" className="w-3.5 h-3.5 object-contain" /> Instagram</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={facebookIcon} alt="Facebook" className="w-3.5 h-3.5 object-contain" /> Facebook</a>
              <a href="#" className="hover:text-orange-650 transition-colors flex items-center gap-1.5"><img src={linkedinIcon} alt="LinkedIn" className="w-3.5 h-3.5 object-contain" /> LinkedIn</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dark Bar */}
      <div className="bg-[#1A2236] text-gray-300 text-[11px] py-4 px-6 border-t border-gray-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="text-center md:text-left space-y-1">
            <p className="text-white font-medium">© Demo Regulatory Bank of India. All Rights Reserved.</p>
            <p>Website owned and managed by Demo Regulatory Bank of India. Contact us on <span className="text-[#d89b3b] font-bold">helpdoc(at)drbi(dot)org(dot)in</span></p>
            <p className="opacity-70">Supports: Google Chrome 125+ | Firefox 126+ | Microsoft Edge Version 125+ | Safari 17+</p>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p><a href="#" className="hover:text-white transition-colors">Sitemap</a> | <a href="#" className="hover:text-white transition-colors">Disclaimer</a></p>
            <p className="opacity-70">Website last updated date: Jun 13, 2026</p>
            <p><a href="#" className="hover:text-white transition-colors">Accessibility Statement</a>, <a href="#" className="hover:text-white transition-colors">Screen Reader</a> and <a href="#" className="hover:text-white transition-colors">Accessibility Help</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
