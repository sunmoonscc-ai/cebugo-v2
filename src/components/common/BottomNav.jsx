import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiStore2Line, 
  RiShoppingBag3Line, 
  RiNewspaperLine, 
  RiMegaphoneLine 
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

export default function BottomNav() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.isAdmin;
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavLink to="/daily-info" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiNewspaperLine className="nav-icon" />
          <span className="nav-label">News</span>
        </NavLink>

        {isAdmin ? (
          <NavLink to="/marketplace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <RiShoppingBag3Line className="nav-icon" />
            <span className="nav-label">중고거래</span>
          </NavLink>
        ) : (
          <div 
            className="nav-item" 
            onClick={() => alert("오픈 준비중입니다.")}
            style={{ opacity: 0.4, cursor: 'not-allowed' }}
          >
            <RiShoppingBag3Line className="nav-icon" />
            <span className="nav-label">중고거래</span>
          </div>
        )}

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
