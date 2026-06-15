import { useState } from 'react';

const functionSites = [
  'Monetary Policy',
  'Banker to Governments and Banks',
  'Currency Management',
  'Consumer Education and Protection',
  'Debt Management',
  'Enforcement',
  'External Investments and Operations',
  'Financial Inclusion and Development',
  'Financial Markets',
  'Financial Stability Analysis',
  'FinTech',
  'Foreign Exchange Management',
  'International Relations',
  'Payment and Settlement Systems',
  'Regulation',
  'Supervision',
  'Research',
];

export default function RightSidebar() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  return (
    <aside className="w-full flex-shrink-0 flex flex-col gap-4 select-none">
      {/* FUNCTIONWISE SITES Accordion */}
      <section className="bg-white border border-drbi-border rounded-none shadow-none p-1">
        <h3 className="text-[#cf8a2b] font-bold text-[13px] px-2 py-1.5 border-b border-drbi-border m-0 font-sans flex gap-1 uppercase">
          FUNCTIONWISE <span className="text-gray-800 font-normal">SITES</span>
        </h3>

        <div className="flex flex-col mt-1 max-h-[445px] overflow-y-auto border border-drbi-border">
          {functionSites.map((site) => (
            <div key={site} className="mb-0.5 last:mb-0">
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 flex justify-between items-center bg-[#184680] hover:bg-[#0c274c] text-white font-bold text-[12px] rounded-none transition-colors group"
                onClick={() =>
                  setOpenAccordion(openAccordion === site ? null : site)
                }
              >
                <span>{site}</span>
                <span className="text-[9px] text-white">
                  {openAccordion === site ? '▲' : '▼'}
                </span>
              </button>

              {openAccordion === site && (
                <div className="bg-gray-50 text-gray-800 p-2 text-[11px] border border-drbi-border rounded-none">
                  <ul className="flex flex-col gap-1.5 text-blue-800">
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 text-[6px]">●</span>
                      <a href="#" className="hover:underline">Overview</a>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 text-[6px]">●</span>
                      <a href="#" className="hover:underline">Recent Announcements</a>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 text-[6px]">●</span>
                      <a href="#" className="hover:underline">Contact Info</a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-3 p-2 bg-gray-50 border border-drbi-border">
          <div className="flex items-stretch gap-1">
            <input
              type="text"
              className="px-2 py-1 flex-1 text-[12px] border border-gray-400 bg-white outline-none rounded-none text-black placeholder:text-gray-400"
              placeholder="Search"
            />
            <button
              type="button"
              className="bg-black text-white text-[11px] font-bold px-3 py-1 rounded-none hover:bg-gray-800 transition-colors uppercase cursor-pointer"
            >
              SEARCH
            </button>
          </div>
        </div>
      </section>
    </aside>
  );
}