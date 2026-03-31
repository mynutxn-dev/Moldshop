import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import api from '../services/api';

// Hub SSO Configuration
const HUB_URL = process.env.REACT_APP_HUB_URL || 'https://polyfoampfs-hub.vercel.app';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasSSOToken = Boolean(searchParams.get('sso_token'));

  // Dynamic Hub Login URL with redirect
  const getHubLoginUrl = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/login');
    return `${HUB_URL}/login?redirect=${redirectUrl}`;
  };

  // Handle SSO token from Hub
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    if (ssoToken) {
      setSsoLoading(true);
      setError('');
      api.post('/auth/sso', { sso_token: ssoToken })
        .then(({ data }) => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success(`ยินดีต้อนรับ ${data.user.firstName} (SSO)`);
          navigate('/');
        })
        .catch((err) => {
          console.error('SSO login failed:', err);
          const message = err.response?.data?.message || 'SSO login failed - กรุณาลองใหม่อีกครั้ง';
          setError(message);
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
    setError('');
    try {
      const { data } = await authAPI.login(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`ยินดีต้อนรับ ${data.user.firstName}`);
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // SSO Processing State
  if (ssoLoading) {
    return (
      <div className="login-page">
        <div className="login-shell">
          <div className="login-showcase">
            <div className="login-showcase-card">
              <span className="login-badge">PFS Portal Hub</span>
              <h1 className="login-showcase-title">กำลังเชื่อมต่อบัญชีของคุณ</h1>
              <p className="login-showcase-text">ระบบกำลังยืนยันสิทธิ์จาก Hub และเตรียม workspace ของ Moldshop ให้พร้อมใช้งาน</p>
              <div className="login-feature-list compact">
                <div className="login-feature-item">
                  <span className="login-feature-icon">🔐</span>
                  <div>
                    <strong>ตรวจสอบสิทธิ์แบบรวมศูนย์</strong>
                    <p>ลดการเข้าสู่ระบบซ้ำหลายระบบ</p>
                  </div>
                </div>
                <div className="login-feature-item">
                  <span className="login-feature-icon">⚡</span>
                  <div>
                    <strong>กำลังโหลดข้อมูลส่วนตัว</strong>
                    <p>เตรียมสิทธิ์และเมนูที่เกี่ยวข้องกับคุณ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="login-container">
            <div className="login-card">
              <div className="login-header">
                <img src="/pfslogo.png" alt="Logo" className="login-logo-img" />
                <h1 className="login-title">กำลังเชื่อมต่อ...</h1>
                <p className="login-subtitle">กำลังเข้าสู่ระบบผ่าน PFS Portal Hub</p>
              </div>
              <div className="login-processing">
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p className="login-processing-text">กรุณารอสักครู่ ระบบจะพาคุณเข้าสู่หน้าหลักโดยอัตโนมัติ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-showcase">
          <div className="login-showcase-card">
            <span className="login-badge">Moldshop Management</span>
            <h1 className="login-showcase-title">เชื่อมงานแม่พิมพ์ งานซ่อม และ New Model ให้ทุกทีมเห็นภาพเดียวกัน</h1>
            <p className="login-showcase-text">เข้าถึงข้อมูลแม่พิมพ์ งานแจ้งซ่อม สต๊อค และ New Model ได้จากพื้นที่ทำงานเดียวที่อ่านง่ายขึ้นและพร้อมใช้งานจริงในโรงงาน</p>
            <div className="login-feature-list">
              <div className="login-feature-item">
                <span className="login-feature-icon">🏭</span>
                <div>
                  <strong>จัดการแม่พิมพ์</strong>
                  <p>ติดตามสถานะ ประวัติ และข้อมูลทุกตัวแม่พิมพ์</p>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">🔧</span>
                <div>
                  <strong>งานซ่อมบำรุง & Work Orders</strong>
                  <p>แจ้งซ่อมและติดตามสถานะงานได้แบบ Real-time</p>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">📦</span>
                <div>
                  <strong>คลังอะไหล่สำรอง</strong>
                  <p>จัดการสต๊อคอะไหล่พร้อมประวัติเบิก-รับ</p>
                </div>
              </div>
            </div>
            <div className="login-highlights">
              <span className="login-highlight-pill">SSO พร้อมใช้งาน</span>
              <span className="login-highlight-pill">รองรับงานแม่พิมพ์ประจำวัน</span>
              <span className="login-highlight-pill">เชื่อมต่อ PFS Portal</span>
            </div>
          </div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <img src="/pfslogo.png" alt="Logo" className="login-logo-img" />
              <span className="login-card-badge">Moldshop</span>
              <h1 className="login-title">เข้าสู่ระบบ</h1>
              <p className="login-subtitle">ระบบจัดการแม่พิมพ์ งานซ่อม และสต๊อค</p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* SSO Button - show when not coming from Hub */}
            {!hasSSOToken && (
              <div className="login-sso-section">
                <a
                  href={getHubLoginUrl()}
                  className="login-sso-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  เข้าสู่ระบบผ่าน PFS Portal Hub
                </a>
                <div className="login-divider">
                  <span>หรือเข้าสู่ระบบด้วยบัญชีภายใน</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">ชื่อผู้ใช้งาน</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">รหัสผ่าน</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="login-footer">
              <p>© 2026 Moldshop Management System</p>
              <span>เชื่อมต่อผ่าน PFS Portal Hub ได้ตลอดเวลา</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
