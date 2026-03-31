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
import DataTransfer from './pages/DataTransfer';
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
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onHoverChange={setSidebarHovered}
        />
      </div>
      <main className="main-content" onClick={() => setSidebarOpen(false)}>
        <Topbar onMenuClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }} isMenuOpen={sidebarOpen} />
        {children}
      </main>
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
                <Route path="/data-transfer" element={<DataTransfer />} />
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
