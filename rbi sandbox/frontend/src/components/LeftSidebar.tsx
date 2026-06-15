import { useState } from 'react';
import logoRbi from '../assets/img/Site_Logo.png';   // RBI-IDS
import rbiRetail from '../assets/img/RBI_Retail_Direct_logo_New.jpg';
import maniImg from '../assets/img/MANI_LOGO.jpg';               // MANI
import udgamImg from '../assets/img/UDGAM_Portal_Text.png';
import rbiMuseumImg from '../assets/img/The-RBI-Museum_New_AP.png';    // ADD this asset
import pravaahImg from '../assets/img/PRAVAAHLOGOText.png';         // ADD this asset
import fintechImg from '../assets/img/logo_for_rbi_website.png';         // ADD this asset
import rbiDataImg from '../assets/img/RBIDATA_Logo.png';
import mascotImg from '../assets/img/RBI_KEHTA_HAI_ICON_New_Eng.png'; // wide banner version

const rates = [
  'Policy Rates',
  'Reserve Ratios',
  'Exchange Rates',
  'Lending / Deposit Rates',
  'Market Trends',
];

const rateData: Record<string, [string, string][]> = {
  'Policy Rates': [
    ['Repo Rate', '6.50%'],
    ['Reverse Repo Rate', '3.35%'],
    ['MSF Rate', '6.75%'],
  ],
  'Reserve Ratios': [
    ['CRR', '4.50%'],
    ['SLR', '18.00%'],
  ],
  'Exchange Rates': [
    ['USD/INR', '83.12'],
    ['EUR/INR', '90.45'],
  ],
  'Lending / Deposit Rates': [
    ['Base Rate', '8.75%'],
    ['Term Deposit', '6.80%'],
  ],
  'Market Trends': [
    ['10Y G-Sec', '7.15%'],
    ['Call Money Rate', '6.45%'],
  ],
};

export default function LeftSidebar() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  return (
    <aside className="w-full flex-shrink-0 flex flex-col gap-4">
      {/* 1. Current Rates */}
      <section className="bg-white border border-drbi-border rounded-none shadow-none p-1">
        <h3 className="text-[#184680] font-bold text-[13px] px-2 py-1.5 border-b border-drbi-border m-0 font-sans flex gap-1 uppercase">
          <span className="text-orange-600 font-bold">1</span> Current Rates
        </h3>

        <div className="flex flex-col mt-1">
          {rates.map((rate) => (
            <div key={`rate-${rate}`} className="mb-0.5 last:mb-0">
              <button
                type="button"
                aria-expanded={openAccordion === rate}
                className="w-full text-left px-3 py-1.5 flex justify-between items-center bg-[#184680] hover:bg-[#0c274c] text-white font-bold text-[12px] rounded-none transition-colors group select-none"
                onClick={() => toggleAccordion(rate)}
              >
                <span>{rate}</span>
                <span className="text-[9px] text-white">{openAccordion === rate ? '▲' : '▼'}</span>
              </button>

              {openAccordion === rate && (
                <div className="bg-gray-50 text-gray-800 p-2 text-[11px] border border-drbi-border rounded-none">
                  <table className="w-full">
                    <tbody>
                      {rateData[rate]?.map(([label, value]) => (
                        <tr key={`${rate}-${label}`} className="border-b border-drbi-border last:border-0">
                          <td className="py-1 text-gray-600">{label}</td>
                          <td className="text-right py-1 font-bold text-[#184680]">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Connect 2 Regulate */}
      <section className="bg-white border border-drbi-border rounded-none shadow-none p-1">
        <h3 className="text-[#184680] font-bold text-[13px] px-2 py-1.5 border-b border-drbi-border m-0 font-sans flex gap-1 uppercase">
          <span className="text-orange-600 font-bold">2</span> Connect 2 Regulate
        </h3>

        <div className="mt-1">
          <button
            type="button"
            className="w-full bg-[#184680] text-white text-[12px] font-bold py-2 px-3 hover:bg-[#0c274c] transition-colors rounded-none text-center"
          >
            Connect 2 Regulate
          </button>
        </div>
      </section>

      {/* 3. RBI Regulated Entities */}
      <section className="bg-white border border-drbi-border rounded-none shadow-none p-1">
        <h3 className="text-[#184680] font-bold text-[13px] px-2 py-1.5 border-b border-drbi-border m-0 font-sans flex gap-1 uppercase">
          <span className="text-orange-600 font-bold">3</span> RBI Regulated Entities
        </h3>

        <div className="mt-1">
          <button
            type="button"
            className="w-full bg-[#184680] text-white text-[12px] font-bold py-2 px-3 hover:bg-[#0c274c] transition-colors rounded-none mb-3 text-center"
          >
            RBI Regulated Entities
          </button>

          <div className="grid grid-cols-2 place-items-center">
            {[
              { src: logoRbi, alt: "RBI Logo" },
              { src: rbiRetail, alt: "Retail Direct" },
              { src: maniImg, alt: "MANI" },
              { src: udgamImg, alt: "UDGAM" },
              { src: rbiMuseumImg, alt: "The RBI Museum" },
              { src: pravaahImg, alt: "PRAVAAH" },
              { src: fintechImg, alt: "FinTech" },
              { src: rbiDataImg, alt: "RBI Data" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center cursor-pointer"
                style={{ width: 'full', height: 'full', margin: '12px 0px -3px 5px' }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="object-contain w-full h-full"
                  style={{
                    border: 'none',
                    verticalAlign: 'middle',
                    overflowClipMargin: 'content-box',
                    overflow: 'clip',
                  }}
                />
              </div>
            ))}

            {/* Full-width RBI Kehta Hai banner */}
            <div className="col-span-2 w-full flex items-center justify-center cursor-pointer">
              <img
                src={mascotImg}
                alt="RBI Kehta Hai - Jaankaar Baniye, Satark Rahiye"
                className="object-contain w-full h-auto"
                style={{
                  border: 'none',
                  verticalAlign: 'middle',
                  overflowClipMargin: 'content-box',
                  overflow: 'clip',
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}