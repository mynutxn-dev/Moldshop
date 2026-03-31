import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiHome, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const pageMeta = [
  { match: (pathname) => pathname === '/', label: 'Overview', title: 'แดชบอร์ดแม่พิมพ์', subtitle: 'ติดตามสถานะงานซ่อม และสต๊อค' },
  { match: (pathname) => pathname.startsWith('/molds'), label: 'Molds', title: 'จัดการแม่พิมพ์', subtitle: 'บันทึกและตรวจสอบสถานะแม่พิมพ์ทั้งหมด' },
  { match: (pathname) => pathname.startsWith('/maintenance'), label: 'Maintenance', title: 'งานแจ้งซ่อม', subtitle: 'ตารางคิวงานซ่อมบำรุงและประวัติการแก้ปัญหา' },
  { match: (pathname) => pathname.startsWith('/work-orders'), label: 'New Model', title: 'New Model', subtitle: 'ติดตามความคืบหน้าการสร้างแม่พิมพ์ใหม่' },
  { match: (pathname) => pathname.startsWith('/inventory'), label: 'Inventory', title: 'จัดการสต๊อค', subtitle: 'ตรวจสอบจำนวนและเบิกจ่ายอะไหล่' },
  { match: (pathname) => pathname.startsWith('/reports'), label: 'Reports', title: 'รายงาน', subtitle: 'สรุปข้อมูลเชิงสถิติและการใช้งาน' },
  { match: (pathname) => pathname.startsWith('/users'), label: 'Users', title: 'ผู้ใช้งานระบบ', subtitle: 'จัดการสิทธิ์เข้าถึงของทีมงาน' },
  { match: (pathname) => pathname.startsWith('/data-transfer'), label: 'Transfer', title: 'โอนย้ายข้อมูล', subtitle: 'สำรองและถ่ายโอนข้อมูลระบบ' }
];

const Topbar = ({ onMenuClick, isMenuOpen }) => {
  const HUB_URL = process.env.REACT_APP_HUB_URL || 'https://polyfoampfs-hub.vercel.app';
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { dark, toggle } = useTheme();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const currentPage = pageMeta.find((item) => item.match(location.pathname)) || { 
    label: 'App', title: 'Moldshop', subtitle: 'Management System' 
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = HUB_URL;
  };

  return (
    <div className="header-bar">
      <div className="header-context">
        <div className="header-context-top-mobile">
          <button 
            type="button"
            className="mobile-side-toggle" 
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
          <span className="header-context-label">Moldshop Core</span>
        </div>
        <h2 className="header-context-title">{currentPage.title}</h2>
        <p className="header-context-subtitle">{currentPage.subtitle}</p>
      </div>

      <div className="header-search">
         {/* No global search for Moldshop yet */}
      </div>

      <div className="header-meta">
        <a href={`${HUB_URL}/dashboard`} className="header-pill" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <FiHome className="h-4 w-4" />
          <span>Portal Hub</span>
        </a>
      </div>

      {/* User Profile */}
      <div className="header-profile" ref={profileRef} onClick={() => setShowProfileMenu(!showProfileMenu)}>
        <div className="header-profile-avatar">
          {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
        </div>
        <div className="header-user-info-desktop">
          <span className="header-profile-name">{user?.firstName || user?.username || 'ผู้ใช้งาน'}</span>
          <span className="header-profile-role">{user?.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
        </div>
        <span className="header-profile-caret">{showProfileMenu ? '▴' : '▾'}</span>

        {showProfileMenu && (
          <div className="header-profile-menu" onClick={(e) => e.stopPropagation()}>
            <div
              className="header-profile-menu-item"
              onClick={() => { setShowProfileMenu(false); toggle(); }}
            >
              {dark ? <><FiSun /> <span>เปิด Light Mode</span></> : <><FiMoon /> <span>เปิด Dark Mode</span></>}
            </div>
            <div
              className="header-profile-menu-item danger"
              onClick={() => { setShowProfileMenu(false); handleLogout(); }}
            >
              <FiLogOut /> <span>ออกจากระบบ</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
