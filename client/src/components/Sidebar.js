import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiBox, FiTool, FiClipboard, FiBarChart2, FiX, FiPackage } from 'react-icons/fi';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/molds', label: 'จัดการแม่พิมพ์', icon: FiBox },
  { path: '/maintenance', label: 'งานแจ้งซ่อม', icon: FiTool },
  { path: '/work-orders', label: 'New Model', icon: FiClipboard },
  { path: '/inventory', label: 'จัดการสต๊อค', icon: FiPackage },
  { path: '/reports', label: 'รายงาน', icon: FiBarChart2 },
];

const Sidebar = ({ isOpen, onClose, onHoverChange }) => {
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.firstName?.[0] || 'A') + (user.lastName?.[0] || 'D');

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

  // On desktop: collapsed (icon-only) by default, expanded on hover
  // On mobile: slide-in drawer controlled by isOpen
  const expanded = hovered;

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
          fixed top-0 left-0 h-full bg-gray-900 text-white z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${expanded ? 'w-64 shadow-2xl shadow-black/40' : 'w-16'}
        `}
        style={{ overflow: 'hidden' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-gray-700/50"
          style={{ padding: expanded ? '0 1rem' : '0', justifyContent: expanded ? 'space-between' : 'center' }}>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 gradient-blue rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm">MS</span>
            </div>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0, whiteSpace: 'nowrap' }}
            >
              <h1 className="font-bold text-lg leading-tight">Moldshop</h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg flex-shrink-0"
            style={{ display: expanded ? 'block' : 'none' }}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-6 px-2">
          <p
            className="mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider overflow-hidden transition-all duration-300"
            style={{ paddingLeft: expanded ? '0.75rem' : '0', opacity: expanded ? 1 : 0, height: expanded ? '1.25rem' : '0' }}
          >
            เมนูหลัก
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    title={!expanded ? item.label : undefined}
                    className={`
                      flex items-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${expanded ? 'px-3 space-x-3' : 'justify-center px-0'}
                      ${active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? '' : 'opacity-70'}`} />
                    <span
                      className="overflow-hidden transition-all duration-300 whitespace-nowrap"
                      style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0 }}
                    >
                      {item.label}
                    </span>
                    {active && expanded && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700/50">
          <div className={`flex items-center ${expanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-9 h-9 gradient-purple rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div
              className="flex-1 min-w-0 overflow-hidden transition-all duration-300"
              style={{ width: expanded ? 'auto' : '0', opacity: expanded ? 1 : 0 }}
            >
              <p className="text-sm font-medium truncate whitespace-nowrap">
                {user.firstName || 'Admin'} {user.lastName || ''}
              </p>
              <p className="text-xs text-gray-400 truncate whitespace-nowrap">แผนก Moldshop</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-1 flex-1 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-blue-50' : ''}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-blue-600' : ''}`}>
                  {item.label.length > 6 ? item.label.substring(0, 6) + '..' : item.label}
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
