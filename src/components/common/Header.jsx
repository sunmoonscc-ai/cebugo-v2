import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LevelBadge } from './Badge';
import TopNoticeTickerBanner from './TopNoticeTickerBanner';
import { RiGlobalLine, RiAdminLine, RiUser3Line, RiLockUnlockLine } from 'react-icons/ri';
import './Header.css';

export default function Header() {
  const { currentUser, userProfile } = useAuth();
  const isGuest = !currentUser;

  return (
    <header className="main-header">
      <div className="header-inner">
        <Link to="/" className="brand-logo">
          <RiGlobalLine className="logo-icon" />
          <span className="brand-text">Cebugo<span className="brand-sub">Hub</span></span>
        </Link>

        <div className="header-actions">
          {userProfile?.isAdmin ? (
            <Link to="/admin/submissions" className="admin-badge-btn" title="관리자 센터">
              <RiAdminLine />
              <span>관리자</span>
            </Link>
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
