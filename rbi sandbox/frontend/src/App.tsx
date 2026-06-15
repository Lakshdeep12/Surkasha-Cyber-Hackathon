import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LanguageModal from './components/LanguageModal';
import TopBar from './components/TopBar';
import MainHeader from './components/MainHeader';
import NavBar from './components/NavBar';
import Preamble from './components/Preamble';
import LeftSidebar from './components/LeftSidebar';
import WhatsNewFeed from './components/WhatsNewFeed';
import RightSidebar from './components/RightSidebar';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import CircularManagement from './pages/CircularManagement';
import PublishRegulation from './pages/PublishRegulation';
import EventFeed from './pages/EventFeed';
import PublishedNotices from './pages/PublishedNotices';

function Home() {
  return (
    <>
      <Preamble />
      <main className="flex-1 w-[1320px] mx-auto py-6 flex flex-row gap-6 items-start bg-white select-none">
        <div className="w-[300px] flex-shrink-0">
          <LeftSidebar />
        </div>
        <div className="flex-1">
          <WhatsNewFeed />
        </div>
        <div className="w-[300px] flex-shrink-0">
          <RightSidebar />
        </div>
      </main>
    </>
  );
}

export default function App() {
  const [showLangModal, setShowLangModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const pref = localStorage.getItem('preferredLanguage');
    if (!pref) {
      setShowLangModal(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#e6e6e6] text-black">
      {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}
      
      <TopBar />
      <MainHeader />
      <NavBar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Dashboard onNavigate={(p) => navigate(`/admin/${p}`)} />} />
        <Route path="/admin/circulars" element={<CircularManagement />} />
        <Route path="/admin/publish" element={<PublishRegulation />} />
        <Route path="/admin/events" element={<EventFeed />} />
        <Route path="/admin/published" element={<PublishedNotices />} />
      </Routes>

      <Footer />
    </div>
  );
}
