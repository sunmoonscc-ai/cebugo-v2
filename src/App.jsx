import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';

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
      <BottomNav />
    </div>
  );
}
