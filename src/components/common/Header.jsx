import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlaces } from '../../context/PlacesContext';
import { LevelBadge } from './Badge';
import TopNoticeTickerBanner from './TopNoticeTickerBanner';
import { RiGlobalLine, RiAdminLine, RiUser3Line, RiNotification3Line } from 'react-icons/ri';
import './Header.css';

export default function Header() {
  const { currentUser, userProfile } = useAuth();
  const { submissions } = usePlaces();
  const isGuest = !currentUser;

  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;

  return (
    <header className="main-header">
      <div className="header-inner">
        <Link to="/" className="brand-logo">
          <RiGlobalLine className="logo-icon" />
          <span className="brand-text">Cebugo<span className="brand-sub">Hub</span></span>
        </Link>

        <div className="header-actions">
          {userProfile?.isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pendingCount > 0 && (
                <Link to="/admin/submissions" className="admin-bell-icon" title="확인해야 할 새 제보가 있습니다" style={{ display: 'flex', alignItems: 'center', position: 'relative', color: '#ef4444', textDecoration: 'none' }}>
                  <RiNotification3Line style={{ fontSize: '1.4rem' }} />
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
                    {pendingCount}
                  </span>
                </Link>
              )}
              <Link to="/admin/submissions" className="admin-badge-btn" title="관리자 센터">
                <RiAdminLine />
                <span>관리자</span>
              </Link>
            </div>
          ) : (
            <Link to="/profile" className="user-profile-summary" title={isGuest ? "로그인하시면 더 많은 정보와 혜택을 이용하실 수 있습니다." : `${userProfile?.displayName} 프로필`}>
              <LevelBadge level={userProfile?.level || 1} isGuest={isGuest} />
            </Link>
          )}

          <Link to="/profile" className="user-profile-summary" title={isGuest ? "로그인하시면 더 많은 정보와 혜택을 이용하실 수 있습니다." : `${userProfile?.displayName} 프로필`}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="profile" className="header-avatar" />
            ) : (
              <div className="avatar-placeholder"><RiUser3Line /></div>
            )}
          </Link>
        </div>
      </div>

      {/* Top Notice & News Ticker Banner (No '전광판' label text as requested) */}
      <TopNoticeTickerBanner />
    </header>
  );
}
