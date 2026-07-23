import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RiStore2Line, 
  RiShoppingBag3Line, 
  RiNewspaperLine, 
  RiArticleLine, 
  RiUser3Line 
} from 'react-icons/ri';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiStore2Line className="nav-icon" />
          <span className="nav-label">업체정보</span>
        </NavLink>

        <NavLink to="/marketplace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiShoppingBag3Line className="nav-icon" />
          <span className="nav-label">중고 거래</span>
        </NavLink>

        <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiArticleLine className="nav-icon" />
          <span className="nav-label">업체 소식</span>
        </NavLink>

        <NavLink to="/daily-info" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiNewspaperLine className="nav-icon" />
          <span className="nav-label">오늘의 정보</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <RiUser3Line className="nav-icon" />
          <span className="nav-label">마이페이지</span>
        </NavLink>
      </div>
    </nav>
  );
}
