import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showcaseMetrics = [
    { value: '24/7', label: 'ติดตามสถานะงานแม่พิมพ์' },
    { value: '1 View', label: 'เห็นงานซ่อมและ New Model พร้อมกัน' },
    { value: 'Live', label: 'พร้อมรับ SSO จาก Portal Hub' }
  ];

  // Handle SSO token from Hub
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    if (ssoToken) {
      setSsoLoading(true);
      api.post('/auth/sso', { sso_token: ssoToken })
        .then(({ data }) => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success(`ยินดีต้อนรับ ${data.user.firstName} (SSO)`);
          navigate('/');
        })
        .catch((error) => {
          console.error('SSO login failed:', error);
          const message = error.response?.data?.message || 'SSO login failed - please try again';
          toast.error(message);
          setSsoLoading(false);
        });
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`ยินดีต้อนรับ ${data.user.firstName}`);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  if (ssoLoading) {
    return (
      <div className="login-shell">
        <div className="login-loading-card animate-scale-in text-center">
          <div className="login-spinner animate-spin mx-auto mb-6"></div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">SSO Authenticating...</p>
          <p className="mt-2 text-sm text-slate-500">กำลังเข้าสู่ระบบผ่าน Hub</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell overflow-hidden px-4">
      <div className="login-panel animate-scale-in relative z-10">
        <div className="login-showcase">
          <div className="flex items-center gap-3">
            <div className="sidebar-brand-mark flex-shrink-0">
              <span className="text-sm font-bold text-white">MS</span>
            </div>
            <div>
              <p className="login-kicker">Moldshop Management</p>
              <p className="text-sm text-slate-300">Production &amp; Maintenance Control</p>
            </div>
          </div>

          <div className="mt-10">
            <span className="hero-badge">Operational Visibility</span>
            <h2 className="login-title">เชื่อมงานแม่พิมพ์ งานซ่อม และ New Model ให้ทุกทีมเห็นภาพเดียวกัน</h2>
            <p className="login-subtitle">
              เข้าถึงข้อมูลแม่พิมพ์ งานแจ้งซ่อม สต๊อค และ New Model ได้จากพื้นที่ทำงานเดียวที่อ่านง่ายขึ้นและพร้อมใช้งานจริงในโรงงาน
            </p>
          </div>

          <div className="login-metric-grid">
            {showcaseMetrics.map((item) => (
              <div key={item.label} className="login-metric-card">
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </div>
            ))}
          </div>

          <div className="login-note-card">
            <p className="text-sm font-semibold text-white">เชื่อมต่อกับ Portal ได้ทันที</p>
            <p className="mt-2 text-sm text-slate-300">
              หากเข้ามาจาก Hub ระบบจะรับ SSO token และเข้าสู่ระบบให้อัตโนมัติ โดยไม่ต้องกรอกรหัสผ่านซ้ำ
            </p>
          </div>
        </div>

        <div className="login-form-card">
          <div className="login-form-header">
            <a href="http://localhost:3000/dashboard" className="portal-link">
              <FiArrowLeft className="h-4 w-4" />
              <span>Portal</span>
            </a>
            <span className="topbar-chip">v2.4.0</span>
          </div>

          <div className="mb-10 mt-10">
            {/* Logo area */}
            <div className="flex items-center gap-4">
              <div className="sidebar-brand-mark flex-shrink-0">
                <span className="text-sm font-bold text-white">MS</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Moldshop</h1>
                <p className="mt-1.5 text-sm text-slate-500">เข้าสู่ระบบเพื่อจัดการแม่พิมพ์ งานซ่อม และสต๊อคอย่างเป็นระบบ</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block px-1 text-xs font-medium text-slate-500">Username</label>
              <div className="login-field relative">
                <div className="login-field-icon absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FiUser className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  className="login-input block w-full pr-4 text-sm font-medium"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block px-1 text-xs font-medium text-slate-500">Password</label>
              <div className="login-field relative">
                <div className="login-field-icon absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  className="login-input block w-full pr-12 text-sm font-medium"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="login-password-toggle absolute inset-y-0 right-0 flex items-center pr-4"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="login-submit"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <FiArrowLeft className="h-4 w-4 rotate-180" />}
              </button>
            </div>
          </form>

          <div className="login-meta">
            <span>© 2026 Moldshop</span>
            <span>SSO จาก Hub จะเข้าสู่ระบบอัตโนมัติ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
