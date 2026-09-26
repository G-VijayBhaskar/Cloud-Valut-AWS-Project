import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Folder, 
  FileText, 
  Clock, 
  Trash2, 
  Settings, 
  Terminal, 
  LogOut, 
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { StorageStats } from '../types';
import { CloudVaultLogo } from './CloudVaultLogo';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    if (user) {
      api.getStorageStats()
        .then(setStats)
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const usedPercentage = stats 
    ? Math.min(100, Math.round((stats.used_storage / stats.total_storage) * 100))
    : 0;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <CloudVaultLogo size={38} />
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            CloudVault
          </h1>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Secure Cloud Storage</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/files" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>My Files</span>
        </NavLink>

        <NavLink 
          to="/folders" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Folder size={18} />
          <span>Folders</span>
        </NavLink>

        <NavLink 
          to="/recent" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Clock size={18} />
          <span>Recent</span>
        </NavLink>

        <NavLink 
          to="/trash" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Trash2 size={18} />
          <span>Trash</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        {/* Developer Status link ONLY for developer role */}
        {user?.role === 'developer' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '0.75rem', letterSpacing: '0.05em' }}>
              Developer Mode
            </span>
            <NavLink 
              to="/developer" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={{ marginTop: '0.5rem' }}
            >
              <Terminal size={18} style={{ color: '#c084fc' }} />
              <span style={{ color: '#c084fc', fontWeight: '600' }}>Developer Status</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Storage Footer Widget */}
      {stats && (
        <div style={{
          margin: '0.75rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HardDrive size={14} /> Storage
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {usedPercentage}%
            </span>
          </div>
          <div className="progress-bar-bg" style={{ height: '6px', marginBottom: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${usedPercentage}%` }}></div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formatSize(stats.used_storage)} / {formatSize(stats.total_storage)}
          </p>
        </div>
      )}

      {/* User Logout Footer */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ overflow: 'hidden', paddingLeft: '0.25rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {user?.username}
          </p>
          <span className={`badge ${user?.role === 'developer' ? 'badge-purple' : 'badge-blue'}`}>
            {user?.role}
          </span>
        </div>
        <button 
          onClick={handleLogout} 
          title="Logout"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
