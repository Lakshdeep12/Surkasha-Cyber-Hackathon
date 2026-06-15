import { useState } from 'react';

const navData = [
  { title: 'Home', link: '/' },
  {
    title: 'About Us',
    dropdown: [
      { title: 'About us', link: '#' },
      {
        title: 'Organization & function',
        subDropdown: [
          { title: 'Organisation Structure', link: '#' },
          { title: 'Departments', link: '#' },
          { title: 'Offices', link: '#' },
          {
            title: 'Training Establishment',
            subDropdown: [
              { title: 'College of Agriculture Banking', link: '#' },
              { title: 'Reserve Bank Staff college', link: '#' },
              { title: 'College of Supervisors', link: '#' },
            ],
          },
        ],
      },
      { title: 'DRBIs Functions and Working', link: '#' },
      { title: 'Governor', link: '#' },
      { title: 'Deputy Governors', link: '#' },
      { title: 'Executive Directors', link: '#' },
    ],
  },
  {
    title: 'Notification',
    dropdown: [
      { title: 'Notifications', link: '#' },
      { title: 'Master Directors', link: '#' },
      { title: 'Master curriculars', link: '#' },
      { title: 'Amendment Direction', link: '#' },
      {
        title: 'Draft Notifications/ Guidelines',
        subDropdown: [
          { title: 'Draft Notifications/Guidelines', link: '#' },
          { title: 'Draft Directions (Re-wise)', link: '#' },
        ],
      },
      { title: 'Index to DRBI curriculars', link: '#' },
      { title: 'Standalone curriculars', link: '#' },
      { title: 'Curriculars withdrawn', link: '#' },
    ],
  },
  { title: 'Press Releases', link: '#' },
  {
    title: 'Speeches & Media Interactions',
    dropdown: [
      { title: 'Speeches', link: '#' },
      { title: 'Media Interactions', link: '#' },
      { title: 'Memorial Lectures', link: '#' },
      { title: 'Podcast', link: '#' },
    ],
  },
  {
    title: 'Publications',
    dropdown: [
      { title: 'Biennial', link: '#' },
      { title: 'Annually', link: '#' },
      { title: 'Half yearly', link: '#' },
      { title: 'Quatarly', link: '#' },
      { title: 'Bi-Monthly', link: '#' },
      { title: 'Monthly', link: '#' },
      { title: 'Weekly', link: '#' },
      { title: 'Occasional', link: '#' },
      { title: 'Reports', link: '#' },
      { title: 'Working papers', link: '#' },
    ],
  },
  {
    title: 'Legal Framework',
    dropdown: [
      { title: 'Act', link: '#' },
      { title: 'Rules', link: '#' },
      { title: 'Regulations', link: '#' },
      { title: 'Schemas', link: '#' },
    ],
  },
  {
    title: 'Research',
    dropdown: [
      { title: 'External Research schemas', link: '#' },
      { title: 'DRBI Occasional papers', link: '#' },
      { title: 'Working papers', link: '#' },
      { title: 'DRBI Bulletins', link: '#' },
      { title: 'History', link: '#' },
      { title: 'DRG studies', link: '#' },
      { title: 'KLEMS', link: '#' },
      { title: 'State statics and finance', link: '#' },
    ],
  },
  {
    title: 'Statistics',
    dropdown: [
      { title: 'Data releases', link: '#' },
      { title: 'Database on India', link: '#' },
      { title: 'Public Debt Statistics', link: '#' },
    ],
  },
  {
    title: 'Regulatory Reporting',
    dropdown: [
      { title: 'List of returns', link: '#' },
      { title: 'Data Definitions', link: '#' },
      { title: 'Validations Rules/ Taxonomy', link: '#' },
      { title: 'List of DRBI reporting portals', link: '#' },
      { title: 'FAQs of DRBI reporting portals', link: '#' },
    ],
  },
];

export default function NavBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav className="w-full h-[42px] bg-[#d89b3b] border-y border-[#be7d1e] relative z-40 select-none">
      <div className="w-[1320px] mx-auto h-full flex flex-row flex-nowrap items-center">
        {navData.map((item, idx) => (
          <div
            key={idx}
            className="relative group h-full flex-1 flex items-center justify-center border-r border-[#c2842b] last:border-0"
            onMouseEnter={() => setActiveMenu(item.title)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <a
              href={item.link || '#'}
              className="flex items-center justify-center w-full h-full text-[14px] font-sans font-medium text-black px-1.5 hover:bg-[#c6892e] transition-colors whitespace-nowrap"
            >
              <span className="truncate">{item.title}</span>
              {item.dropdown && <span className="text-[9px] ml-1 text-black flex-shrink-0">▼</span>}
            </a>

            {/* Dropdown menu - Classic flat styling */}
            {item.dropdown && activeMenu === item.title && (
              <div className="absolute left-0 top-[42px] bg-white border border-drbi-border shadow-md py-1 min-w-[240px] z-50 animate-fade-in origin-top">
                {item.dropdown.map((dropItem, dropIdx) => (
                  <div key={dropIdx} className="relative group/sub">
                    <a
                      href={dropItem.link || '#'}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-gray-800 border-b border-drbi-border last:border-0 transition-colors font-sans text-[13px] font-medium"
                    >
                      <span>{dropItem.title}</span>
                      {dropItem.subDropdown && <span className="text-[9px] opacity-70">▶</span>}
                    </a>

                    {/* Sub-dropdown - Classic flat styling */}
                    {dropItem.subDropdown && (
                      <div className="hidden group-hover/sub:block absolute left-full top-0 bg-white border border-drbi-border shadow-md py-1 min-w-[220px] z-50 animate-fade-in origin-left">
                        {dropItem.subDropdown.map((subItem, subIdx) => (
                          <div key={subIdx} className="relative group/subsub">
                            <a
                              href={subItem.link || '#'}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-gray-800 border-b border-drbi-border last:border-0 transition-colors font-sans text-[13px] font-medium"
                            >
                              <span>{subItem.title}</span>
                              {subItem.subDropdown && <span className="text-[9px] opacity-70">▶</span>}
                            </a>

                            {/* Sub-sub-dropdown - Classic flat styling */}
                            {subItem.subDropdown && (
                              <div className="hidden group-hover/subsub:block absolute left-full top-0 bg-white border border-drbi-border shadow-md py-1 min-w-[220px] z-50 animate-fade-in origin-left">
                                {subItem.subDropdown.map((subsubItem, subsubIdx) => (
                                  <a
                                    key={subsubIdx}
                                    href={subsubItem.link || '#'}
                                    className="block px-4 py-2 hover:bg-gray-100 text-gray-850 border-b border-drbi-border last:border-0 transition-colors font-sans text-[13px]"
                                  >
                                    {subsubItem.title}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}