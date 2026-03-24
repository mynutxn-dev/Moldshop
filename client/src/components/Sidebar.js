import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiBox, FiTool, FiClipboard, FiBarChart2, FiX, FiPackage, FiUsers, FiArrowRight } from 'react-icons/fi';

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

const Sidebar = ({ isOpen, onClose, onHoverChange }) => {
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.firstName?.[0] || 'A') + (user.lastName?.[0] || 'D');
  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Production Team';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    onHoverChange?.(false);
  };

  const expanded = hovered || isOpen;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          sidebar-surface fixed top-0 left-0 h-full z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${expanded ? 'w-[17rem]' : 'w-20'}
        `}
        style={{ overflow: 'hidden' }}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/10"
          style={{ padding: expanded ? '0 1rem' : '0', justifyContent: expanded ? 'space-between' : 'center' }}>
          <div className="flex items-center space-x-3">
            <div className="sidebar-brand-mark flex-shrink-0">
              <span className="text-sm font-bold text-white">MS</span>
            </div>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0, whiteSpace: 'nowrap' }}
            >
              <h1 className="text-lg font-bold leading-tight text-white">Moldshop</h1>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">Command Center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="topbar-action md:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {menuItems.map((item) => {
            if (item.adminOnly && user.role !== 'admin') return null;
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={`
                  sidebar-link flex items-center space-x-3 px-3 py-3 rounded-2xl transition-all duration-200
                  ${active ? 'sidebar-link-active' : ''}
                `}
                title={!expanded ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className="font-medium text-sm overflow-hidden transition-all duration-300"
                  style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0, whiteSpace: 'nowrap' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
          <div className={`sidebar-user-card flex items-center ${expanded ? 'space-x-3 px-3 py-3' : 'justify-center px-0 py-3'}`}>
            <div className="sidebar-avatar flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0">
              <span className="text-xs font-bold">{initials}</span>
            </div>
            <div
              className="flex-1 min-w-0 overflow-hidden transition-all duration-300"
              style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0 }}
            >
              <p className="truncate whitespace-nowrap text-sm font-medium text-white">
                {user.firstName || 'Admin'}
              </p>
              <p className="truncate whitespace-nowrap text-xs text-slate-300">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav-surface safe-area-bottom fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="flex items-center justify-around">
          {menuItems.filter(item => !item.adminOnly || user?.role === 'admin').slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center px-1 py-2.5 transition-colors ${active ? 'mobile-tab-active text-blue-600' : 'text-slate-400'}`}
              >
                <div className={`rounded-2xl p-2 transition-all duration-200 ${active ? 'bg-blue-50 shadow-sm' : ''}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`} />
                </div>
                <span className={`mt-1 text-[10px] font-semibold ${active ? 'text-blue-700' : ''}`}>
                  {item.label.length > 5 ? item.label.substring(0, 5) + '..' : item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
