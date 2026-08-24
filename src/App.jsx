import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import AdTickerBanner from './components/common/AdTickerBanner';
import ScrollToTopButton from './components/common/ScrollToTopButton';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

import useVisitorLogging from './hooks/useVisitorLogging';

function VisitorLogger() {
  useVisitorLogging();
  return null;
}

// Pages
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import DailyInfoPage from './pages/DailyInfoPage';
import PlaceFeedPage from './pages/PlaceFeedPage';

// Admin Pages
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminConfigPage from './pages/admin/AdminConfigPage';

export default function App() {
  return (
    <div className="app-container">
      <ScrollToTop />
      <VisitorLogger />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/place/:id" element={<DetailPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/daily-info" element={<DailyInfoPage />} />
          <Route path="/feed" element={<PlaceFeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
          <Route path="/admin/config" element={<AdminConfigPage />} />
        </Routes>
      </main>
      <AdTickerBanner />
      <BottomNav />
      <ScrollToTopButton />
    </div>
  );
}
