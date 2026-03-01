import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import MoldList from './pages/MoldList';
import MoldDetail from './pages/MoldDetail';
import Maintenance from './pages/Maintenance';
import MaintenanceCalendar from './pages/MaintenanceCalendar';
import WorkOrders from './pages/WorkOrders';
import WorkOrderCalendar from './pages/WorkOrderCalendar';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Users from './pages/Users';
import { ThemeProvider } from './contexts/ThemeContext';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHoverChange={setSidebarHovered}
      />
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: undefined }}
      >
        {/* Desktop: shift margin based on hover state */}
        <style>{`
          @media (min-width: 768px) {
            .sidebar-content-area {
              margin-left: ${sidebarHovered ? '16rem' : '4rem'};
              transition: margin-left 0.3s ease-in-out;
            }
          }
          @media (max-width: 767px) {
            .sidebar-content-area {
              margin-left: 0;
            }
          }
        `}</style>
        <div className="sidebar-content-area flex-1 flex flex-col">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <RequireAuth><AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/molds" element={<MoldList />} />
                <Route path="/molds/:id" element={<MoldDetail />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/maintenance/calendar" element={<MaintenanceCalendar />} />
                <Route path="/work-orders" element={<WorkOrders />} />
                <Route path="/work-orders/calendar" element={<WorkOrderCalendar />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
              </Routes>
            </AppLayout></RequireAuth>
          } />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

export default App;
