import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiBox, FiTool, FiClipboard, FiBarChart2, FiPackage, FiUsers, FiArrowRight } from 'react-icons/fi';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/molds', label: 'จัดการแม่พิมพ์', icon: FiBox },
  { path: '/maintenance', label: 'งานแจ้งซ่อม', icon: FiTool },
  { path: '/work-orders', label: 'New Model', icon: FiClipboard },
  { path: '/inventory', label: 'จัดการสต๊อค', icon: FiPackage },
  { path: '/reports', label: 'รายงาน', icon: FiBarChart2 },
  { path: '/users', label: 'ผู้ใช้งาน', icon: FiUsers, adminOnly: true },
  { path: '/data-transfer', label: 'โอนย้ายข้อมูล', icon: FiArrowRight, adminOnly: true },
];

const Sidebar = ({ onLinkClick }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.firstName?.[0] || 'U').toUpperCase();
  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Production Team';
  const isAdmin = user.role === 'admin';

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <>
      <div className="sidebar-logo">
        <img src="/pfslogo.png" alt="Logo" className="sidebar-logo-img" />
        <div className="sidebar-logo-copy">
          <h1>Moldshop</h1>
          <p>Management System</p>
        </div>
      </div>

      <nav className="sidebar-nav" onClick={handleLinkClick}>
        <div className="sidebar-section">
          <div className="sidebar-section-title">เมนูหลัก</div>
          
          {menuItems.filter(item => !item.adminOnly).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                <span className="sidebar-link-icon"><Icon className="h-5 w-5" /></span>
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">เครื่องมือผู้ดูแลระบบ</div>
            {menuItems.filter(item => item.adminOnly).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-link-icon"><Icon className="h-5 w-5" /></span>
                  <span className="sidebar-link-text">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.firstName || user.username || 'ผู้ใช้งาน'}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
