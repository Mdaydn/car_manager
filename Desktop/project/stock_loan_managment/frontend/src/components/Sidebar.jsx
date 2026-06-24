import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Warehouse, 
  CircleDollarSign, 
  BarChart3, 
  LogOut,
  User as UserIcon
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Define sidebar menu options based on roles
  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['admin', 'manager', 'member'],
    },
    {
      path: '/members',
      label: 'Members',
      icon: <Users size={20} />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/products',
      label: 'Products',
      icon: <Package size={20} />,
      roles: ['admin', 'manager'],
    },
    {
      path: '/storage',
      label: 'Storage (Deposits)',
      icon: <Warehouse size={20} />,
      roles: ['admin', 'manager', 'member'],
    },
    {
      path: '/loans',
      label: 'Loans & Payments',
      icon: <CircleDollarSign size={20} />,
      roles: ['admin', 'manager', 'member'],
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: <BarChart3 size={20} />,
      roles: ['admin', 'member'], // User wanted admin reporting, and member reports
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="sidebar" style={sidebarStyle}>
      <div className="sidebar-brand" style={brandStyle}>
        <div style={logoIconStyle}>S</div>
        <div style={brandTextContainer}>
          <span style={brandTitleStyle}>Stock & Loan</span>
          <span style={brandSubtitleStyle}>Movement Manager</span>
        </div>
      </div>

      <div className="sidebar-profile" style={profileStyle}>
        <div style={profileAvatarStyle}>
          <UserIcon size={24} />
        </div>
        <div style={profileInfoStyle}>
          <div style={profileNameStyle}>{user.fullName}</div>
          <span className={`badge badge-${user.role}`} style={{ fontSize: '0.65rem' }}>
            {user.role}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav" style={navStyle}>
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={isActive(item.path) ? activeLinkStyle : linkStyle}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button onClick={logout} style={logoutButtonStyle}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};

// Inline styles for Sidebar structure (keeping the rest in class files)
const sidebarStyle = {
  width: '260px',
  height: '100vh',
  backgroundColor: 'var(--bg-sidebar)',
  borderRight: '1px solid var(--border-light)',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  padding: '1.5rem',
  boxShadow: '4px 0 20px rgba(0, 0, 0, 0.4)',
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const logoIconStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  backgroundColor: 'var(--color-primary)',
  boxShadow: '0 0 10px var(--color-primary-glow)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '800',
  fontSize: '1.25rem',
  color: 'white',
};

const brandTextContainer = {
  display: 'flex',
  flexDirection: 'column',
};

const brandTitleStyle = {
  fontWeight: '700',
  fontSize: '1rem',
  letterSpacing: '-0.3px',
};

const brandSubtitleStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
};

const profileStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  marginBottom: '2rem',
};

const profileAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const profileInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.2rem',
};

const profileNameStyle = {
  fontWeight: '600',
  fontSize: '0.9rem',
  maxWidth: '140px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: 1,
};

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
  fontWeight: '500',
  transition: 'var(--transition-smooth)',
};

const activeLinkStyle = {
  ...linkStyle,
  color: 'var(--text-main)',
  backgroundColor: 'rgba(59, 130, 246, 0.12)',
  borderLeft: '3px solid var(--color-primary)',
  paddingLeft: 'calc(1rem - 3px)',
};

const logoutButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  color: 'var(--color-danger)',
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: '0.95rem',
  fontWeight: '500',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'var(--transition-smooth)',
  marginTop: 'auto',
};

export default Sidebar;
