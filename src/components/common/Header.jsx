import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LevelBadge } from './Badge';
import { RiGlobalLine, RiAdminLine, RiUser3Line } from 'react-icons/ri';
import './Header.css';

export default function Header() {
  const { userProfile } = useAuth();

  return (
    <header className="main-header">
      <div className="header-inner">
        <Link to="/" className="brand-logo">
          <RiGlobalLine className="logo-icon" />
          <span className="brand-text">Cebugo<span className="brand-sub">Hub</span></span>
        </Link>

        <div className="header-actions">
          {userProfile?.isAdmin && (
            <Link to="/admin/submissions" className="admin-badge-btn" title="관리자 센터">
              <RiAdminLine />
              <span>관리자</span>
            </Link>
          )}

          <Link to="/profile" className="user-profile-summary">
            <LevelBadge level={userProfile?.level || 1} />
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="profile" className="header-avatar" />
            ) : (
              <div className="avatar-placeholder"><RiUser3Line /></div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
