import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiStore2Line, 
  RiShoppingBag3Line, 
  RiNewspaperLine, 
  RiMegaphoneLine,
  RiChat1Line
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserChatRooms } from '../../services/chatService';
import './BottomNav.css';

export default function BottomNav() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin;
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.uid) {
      setUnreadChatCount(0);
      return;
    }
    const unsubscribe = subscribeUserChatRooms(userProfile.uid, (rooms) => {
      const count = rooms.reduce((acc, r) => acc + (r.unreadCount?.[userProfile.uid] || 0), 0);
      setUnreadChatCount(count);
    });
    return () => unsubscribe();
  }, [userProfile?.uid]);

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavLink to="/daily-info" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiNewspaperLine className="nav-icon" />
          <span className="nav-label">News</span>
        </NavLink>

        <NavLink to="/marketplace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-wrap">
            <RiShoppingBag3Line className="nav-icon" />
            {unreadChatCount > 0 && (
              <span className="bottom-nav-badge">{unreadChatCount}</span>
            )}
          </div>
          <span className="nav-label">중고거래</span>
        </NavLink>

        <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiMegaphoneLine className="nav-icon" />
          <span className="nav-label">광고</span>
        </NavLink>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiStore2Line className="nav-icon" />
          <span className="nav-label">업체정보</span>
        </NavLink>
      </div>
    </nav>
  );
}
