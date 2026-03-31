import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiLogOut, FiUser, FiMoon, FiSun, FiHome } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const pageMeta = [
  {
    match: (pathname) => pathname === '/',
    label: 'Dashboard',
    title: 'ภาพรวมการทำงานของแม่พิมพ์',
    subtitle: 'ติดตามสถานะงานซ่อม New Model และ inventory จากมุมมองเดียว'
  },
  {
    match: (pathname) => pathname.startsWith('/molds'),
    label: 'Molds',
    title: 'จัดการแม่พิมพ์และสถานะการใช้งาน',
    subtitle: 'เข้าถึงข้อมูลแม่พิมพ์แต่ละชุดได้รวดเร็วและเป็นระบบ'
  },
  {
    match: (pathname) => pathname.startsWith('/maintenance'),
    label: 'Maintenance',
    title: 'บริหารคิวงานแจ้งซ่อม',
    subtitle: 'ลดงานตกหล่นด้วยมุมมองที่ชัดเจนและอ่านง่ายขึ้น'
  },
  {
    match: (pathname) => pathname.startsWith('/work-orders'),
    label: 'New Model',
    title: 'ติดตามงาน New Model แบบ end-to-end',
    subtitle: 'เห็นลำดับงานและสถานะสำคัญได้จากพื้นที่เดียว'
  },
  {
    match: (pathname) => pathname.startsWith('/inventory'),
    label: 'Inventory',
    title: 'มุมมองสต๊อคที่ชัดและพร้อมใช้งาน',
    subtitle: 'ตรวจสอบจำนวนและความพร้อมของอุปกรณ์ประกอบได้รวดเร็ว'
  },
  {
    match: (pathname) => pathname.startsWith('/reports'),
    label: 'Reports',
    title: 'รายงานและข้อมูลสรุปเชิงปฏิบัติการ',
    subtitle: 'อ่านภาพรวมเชิงธุรกิจได้เร็วขึ้นจากแดชบอร์ดเดียว'
  },
  {
    match: (pathname) => pathname.startsWith('/users'),
    label: 'Users',
    title: 'จัดการผู้ใช้งานและสิทธิ์เข้าถึง',
    subtitle: 'ดูแลทีมงานในระบบได้ใน flow ที่เรียบง่ายขึ้น'
  },
  {
    match: (pathname) => pathname.startsWith('/data-transfer'),
    label: 'Transfer',
    title: 'โอนย้ายข้อมูลอย่างมั่นใจ',
    subtitle: 'รวม action สำคัญไว้ในพื้นที่ทำงานที่เข้าใจง่าย'
  }
];

const Topbar = ({ onMenuClick }) => {
  const HUB_URL = process.env.REACT_APP_HUB_URL || 'https://polyfoampfs-hub.vercel.app';
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { dark, toggle } = useTheme();
  const currentPage = pageMeta.find((item) => item.match(location.pathname)) || pageMeta[0];
  const roleLabel = user.role === 'admin' ? 'Administrator' : 'Production Team';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to Hub instead of internal login
    window.location.href = HUB_URL;
  };

  return (
    <header className="topbar-surface flex items-center justify-between gap-4 px-4 py-3 md:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <button
          onClick={onMenuClick}
          className="topbar-action md:hidden"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="topbar-context min-w-0">
          <span className="topbar-context-label">{currentPage.label}</span>
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="topbar-context-title truncate">{currentPage.title}</h2>
            <span className="topbar-chip hidden xl:inline-flex">{roleLabel}</span>
          </div>
          <p className="topbar-context-subtitle hidden lg:block">{currentPage.subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href={`${HUB_URL}/dashboard`}
          className="portal-link hidden sm:inline-flex"
          title="กลับหน้า Portal"
        >
          <FiHome className="h-4 w-4" />
          <span>Hub</span>
        </a>
        <div className="user-pill hidden xl:flex">
          <FiUser className="h-4 w-4" />
          <span>{user.firstName || 'ผู้ใช้'}</span>
        </div>
        <button onClick={toggle} className="topbar-action btn-press" title={dark ? 'สลับเป็น Light Mode' : 'สลับเป็น Dark Mode'}>
          {dark ? <FiSun className="h-5 w-5 text-amber-500" /> : <FiMoon className="h-5 w-5" />}
        </button>
        <button className="topbar-action relative">
          <FiBell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>
        <button onClick={handleLogout} className="topbar-action topbar-action-danger" title="ออกจากระบบ">
          <FiLogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
