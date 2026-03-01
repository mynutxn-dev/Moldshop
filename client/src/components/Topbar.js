import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiLogOut, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
          Moldshop Management System
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
          <FiUser className="h-4 w-4" />
          <span>{user.firstName || 'ผู้ใช้'} {user.lastName || ''}</span>
          <span className="text-xs text-gray-400">({user.role || '-'})</span>
        </div>
        <button onClick={toggle} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg btn-press" title={dark ? 'สลับเป็น Light Mode' : 'สลับเป็น Dark Mode'}>
          {dark ? <FiSun className="h-5 w-5 text-yellow-500" /> : <FiMoon className="h-5 w-5" />}
        </button>
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <FiBell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg" title="ออกจากระบบ">
          <FiLogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
