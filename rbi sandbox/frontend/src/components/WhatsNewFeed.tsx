import { useState } from 'react';

const newsItems = [
  "Shri Sanjay Lohiya, Secretary, Department of Financial Services, nominated on DRBI Central Board",
  "DRBI invites comments on Harmonisation and Consolidation of Instructions on Control / Assurance Functions",
  "DRBI invites public comments on the draft Amendment Directions on 'Standardised Approach for Counterparty Credit Risk (SA-CCR)'",
  "DRBI invites final Amendment Directions on Lending to Real Estate Investment Trusts (REITs) and Infrastructure Investment Trusts (InvITs)",
  "Demo Regulatory Bank of India (Regional Rural Banks - Cash Reserve Ratio and Statutory Liquidity Ratio) Second Amendment Directions, 2026",
  "Demo Regulatory Bank of India (Rural Co-operative Banks - Cash Reserve Ratio and Statutory Liquidity Ratio) Second Amendment Directions, 2026",
  "Demo Regulatory Bank of India (Urban Co-operative Banks - Cash Reserve Ratio and Statutory Liquidity Ratio) Second Amendment Directions, 2026",
  "Demo Regulatory Bank of India (Small Finance Banks - Cash Reserve Ratio and Statutory Liquidity Ratio) Second Amendment Directions, 2026",
  "Demo Regulatory Bank of India (Commercial Banks - Cash Reserve Ratio and Statutory Liquidity Ratio) Second Amendment Directions, 2026",
  "NDP-INR position of Authorised Dealer Category-I banks",
  "Swap Facility for External Commercial Borrowings and Overseas Foreign Currency Borrowings",
  "Swap Facility for FCNR (B) Deposits",
  "Sources of Variation in India's Foreign Exchange Reserves during April-March 2025-26",
  "Developments in India's Balance of Payments during the Fourth Quarter (January-March) of 2025-26",
  "Shri Swaminathan Janakiraman re-appointed as DRBI Deputy Governor",
  "DRBI releases the results of Forward Looking Surveys",
  "Recognition of Self-Regulatory Organisation for the Account Aggregator Ecosystem",
  "Investments by Foreign Portfolio Investors in Government Securities - Amendments to the regulatory framework"
];

export default function WhatsNewFeed() {
  const [activeTab, setActiveTab] = useState('What\'s New');

  const tabs = ['What\'s New', 'Sections Updated Today', 'Citizen\'s Corner', 'ReKYC'];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white border border-drbi-border rounded-none shadow-none">
      {/* Tabs Row */}
      <div className="flex border-b border-drbi-border overflow-x-auto bg-gray-50 h-[38px] items-end select-none">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          const isReKYC = tab === 'ReKYC';
          return (
            <button
              key={idx}
              className={`whitespace-nowrap px-4 py-1.5 text-[12px] font-bold transition-colors cursor-pointer border-t border-x rounded-none ${isReKYC
                ? 'bg-[#184680] text-white hover:bg-[#0c274c] border-[#184680] ml-auto h-[28px] mr-1 mb-1'
                : isActive
                  ? 'bg-[#fbf2e3] text-black border-gray-300 border-b-[#fbf2e3] -mb-[1px] h-[32px]'
                  : 'bg-white text-[#184680] border-transparent hover:bg-gray-150 h-[28px] border-gray-200 border-b-gray-300'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-[#fbf2e3] p-4 flex-1 border-t border-gray-300">
        <ul className="flex flex-col gap-2.5 text-[14px] font-sans font-normal leading-normal">
          {newsItems.map((item, idx) => (
            <li key={idx} className="border-b border-[#ebd7be] pb-2 last:border-0 flex items-start gap-2">
              <span className="text-[#184680] mt-[5px] text-[14px] flex-shrink-0">●</span>
              <a href="#" className="text-[#184680] hover:underline hover:text-orange-700 leading-snug">
                {item}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <a href="#" className="text-[#184680] font-bold text-[14px] hover:underline uppercase">
            More &gt;&gt;
          </a>
        </div>
      </div>

      {/* Bottom Date-Time Ticker Bar */}
      <div className="bg-[#cf8a2b] text-black text-[11px] py-1.5 px-4 font-sans font-medium flex justify-between items-center border-t border-[#b67820]">
        <span className="opacity-80 uppercase tracking-wider font-bold">Last Updated</span>
        <span className="font-semibold">{new Date().toLocaleTimeString('en-IN')}, {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
}